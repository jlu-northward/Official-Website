"""管理空教室与蹭课课表：交互更新 Excel、修改开学日期、查看当前配置。

本科生课表按教学班逐行列出，研究生课表按节次/星期排列；导入时自动识别，两份课表合并发布。
只需 Python 3 标准库。推荐运行 npm run timetable，详见 README.md。
"""

import argparse
import collections
import copy
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import shlex
import sys
import tempfile
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parent.parent
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
CAMPUSES = ("前卫", "南岭", "朝阳", "新民", "和平", "南湖")
CAMPUS = "|".join(CAMPUSES)
KINDS = {"undergraduate": "本科生", "graduate": "研究生"}
SOURCES = "data/classroom-sources"
WEEKDAYS = "一二三四五六日"
PERIOD_NAMES = ("一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二")
WEEK = r"\d+(?:-\d+)?周(?:[（(][单双][）)])?"
SCHEDULE = re.compile(
    rf"(?P<weeks>{WEEK}(?:\s*[,，]\s*{WEEK})*)\s*"
    r"星期(?P<day>[一二三四五六日天])\s*"
    r"(?:第)?(?P<start>\d+)(?:节)?-(?:第)?(?P<end>\d+)节"
)
WEEK_TOKEN = re.compile(r"^(\d+)(?:-(\d+))?周(?:[（(]([单双])[）)])?$")
GRADUATE_WEEK = re.compile(r"(\d+)(?:-(\d+))?([单双])?周?")
GRADUATE_COURSE = re.compile(r"(?P<name>.+?)\s*\[(?P<section>[^\[\]]*)\]", re.S)
ROOM_NOTE = re.compile(r"[（(](?=[^）)]*(?:优先|教班|教学班|年级|专用|研究生))")
# Graduate places a teacher typed in, e.g. 前卫校区 萃文232; see graduate_location.
FREE_LOCATION = re.compile(rf"(?P<campus>{CAMPUS})校区(?: (?P<text>.+))?", re.S)
BUILDING_SUFFIX = re.compile(r"(?:教学楼|大厦|大楼|楼|馆)$")
ROOM_SUFFIX = re.compile(r"(?:教室|室)$")


def parse_weeks(text, total_weeks):
    weeks = set()
    for token in re.split(r"[,，]\s*", text.strip()):
        match = WEEK_TOKEN.fullmatch(token)
        if not match:
            raise ValueError(f"无法识别周次：{token}")
        first, last, parity = match.groups()
        first, last = int(first), int(last or first)
        if not 1 <= first <= last <= total_weeks:
            raise ValueError(f"周次超出 1—{total_weeks}：{token}")
        weeks.update(
            week for week in range(first, last + 1)
            if parity is None or week % 2 == (1 if parity == "单" else 0)
        )
    if not weeks:
        raise ValueError(f"周次没有有效上课周：{text}")
    return sum(1 << (week - 1) for week in weeks)


def parse_schedules(text, total_weeks):
    matches = list(SCHEDULE.finditer(text))
    if not matches:
        raise ValueError("无法识别上课时间")
    if text[:matches[0].start()].strip(" ,，\n"):
        raise ValueError("上课时间前含无法识别的内容")
    entries = []
    for index, match in enumerate(matches):
        start, end = int(match["start"]), int(match["end"])
        if not 1 <= start <= end <= 12:
            raise ValueError(f"节次超出 1—12：{start}—{end}")
        next_start = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        location = text[match.end():next_start].strip(" ,，\n")
        entries.append({
            "weeks": parse_weeks(match["weeks"], total_weeks),
            "day": WEEKDAYS.index(match["day"].replace("天", "日")) + 1,
            "periods": sum(1 << (period - 1) for period in range(start, end + 1)),
            "location": location,
        })
    return entries


def parse_location(location, aliases):
    parts = location.split("-", 2)
    if len(parts) < 2 or parts[0] not in CAMPUSES:
        return None
    campus = parts[0]
    if len(parts) == 3:
        building, room = parts[1:]
    else:
        # Some entries join the building and room, such as 南岭-(一)101.
        match = re.fullmatch(r"(.+?)(\d+.*)", parts[1])
        if not match:
            return None
        building, room = match.groups()
    building = building.strip()
    # The graduate export may repeat the building, as in 和平-科学讲堂-科学讲堂100教室.
    room = room.strip().removeprefix(building) or room
    building = aliases.get(campus, {}).get(building, building)
    room = ROOM_NOTE.split(room, maxsplit=1)[0].strip()
    # A hyphen after the room identifies a named teaching space in this export.
    room = room.split("-", 1)[0].strip()
    if not building or not room or building == "第":
        return None
    return campus, building, room


def is_missing(location):
    found = FREE_LOCATION.fullmatch(location)
    return not location or bool(found and not found["text"])


def room_matcher(rooms, aliases):
    """Match teacher-entered places such as 萃文232 to rooms the timetable already names.

    Free text never creates a room: a misspelt duplicate would look empty while in use.
    """
    buildings = collections.defaultdict(dict)
    names = {}
    for campus, building, room in rooms:
        for prefix in {building, BUILDING_SUFFIX.sub("", building)}:
            if len(prefix) >= 2:
                # A shortened name shared by two buildings is ambiguous.
                same = buildings[campus].get(prefix, building) == building
                buildings[campus][prefix] = building if same else None
        key = (campus, building, ROOM_SUFFIX.sub("", room))
        names[key] = room if names.get(key, room) == room else None
    for campus, mapping in aliases.items():
        for alias, building in mapping.items():
            buildings[campus].setdefault(alias, building)

    def match(location):
        found = FREE_LOCATION.fullmatch(location)
        if not found or not found["text"]:
            return None
        campus = found["campus"]
        text = re.sub(rf"^{campus}(?:校区)?", "", found["text"])
        for prefix in sorted(buildings[campus], key=len, reverse=True):
            if text.startswith(prefix):
                building = buildings[campus][prefix]
                room = ROOM_NOTE.split(text[len(prefix):], maxsplit=1)[0].strip(" -")
                room = names.get((campus, building, ROOM_SUFFIX.sub("", room)))
                return (campus, building, room) if building and room else None
        return None

    return match


def read_rows(source):
    with zipfile.ZipFile(source) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            strings = [
                "".join(node.itertext())
                for node in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("s:si", NS)
            ]
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        first_sheet = workbook.find("s:sheets/s:sheet", NS)
        if first_sheet is None:
            raise ValueError("Excel 中未找到工作表")
        relation_id = first_sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        relations = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        target = next((item.get("Target") for item in relations if item.get("Id") == relation_id), None)
        if not target:
            raise ValueError("Excel 工作表链接有误")
        sheet_path = target.lstrip("/") if target.startswith("/") else "xl/" + target
        # The supplied workbook declares dimension A1 despite containing thousands of rows.
        sheet = ET.fromstring(archive.read(sheet_path))
        for row in sheet.findall("s:sheetData/s:row", NS):
            values = {}
            for cell in row.findall("s:c", NS):
                value = cell.findtext("s:v", default="", namespaces=NS)
                if cell.get("t") == "s":
                    value = strings[int(value)] if value else ""
                elif cell.get("t") == "inlineStr":
                    inline = cell.find("s:is", NS)
                    value = "".join(inline.itertext()) if inline is not None else ""
                values[re.sub(r"\d", "", cell.get("r"))] = (value or "").strip()
            yield int(row.get("r")), values


def iso_date(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError("日期格式应为 YYYY-MM-DD，例如 2026-09-07")
    try:
        return dt.date.fromisoformat(value)
    except ValueError as error:
        raise ValueError(f"日期不存在：{value}") from error


def validate_semester(semester):
    if not isinstance(semester, dict):
        raise ValueError("学期配置必须为 JSON 对象")
    if not isinstance(semester.get("name"), str) or not semester["name"].strip():
        raise ValueError("请填写课表名称")
    if type(semester.get("weeks")) is not int or not 1 <= semester["weeks"] <= 30:
        raise ValueError("学期周数必须在 1—30 之间")
    monday = semester.get("firstWeekMonday")
    if monday is not None and iso_date(monday).weekday() != 0:
        raise ValueError("第一周起点必须为周一")
    overrides = semester.get("dateOverrides", {})
    if not isinstance(overrides, dict):
        raise ValueError("调休设置 dateOverrides 必须为 JSON 对象")
    for date, override in overrides.items():
        iso_date(date)
        if override is not None and not (
            isinstance(override, dict)
            and type(override.get("week")) is int
            and type(override.get("weekday")) is int
            and 1 <= override["week"] <= semester["weeks"]
            and 1 <= override["weekday"] <= 7
        ):
            raise ValueError(f"调休设置有误：{date}")
    aliases = semester.get("buildingAliases", {})
    if not isinstance(aliases, dict) or any(
        not isinstance(campus, str) or not isinstance(mapping, dict)
        or any(not isinstance(key, str) or not isinstance(value, str) for key, value in mapping.items())
        for campus, mapping in aliases.items()
    ):
        raise ValueError("教学楼别名 buildingAliases 格式有误")


def semester_calendar(semester):
    return {
        "name": semester["name"],
        "firstWeekMonday": semester.get("firstWeekMonday"),
        "weeks": semester["weeks"],
        "dateOverrides": semester.get("dateOverrides", {}),
    }


def note_example(examples, location, where, aliases):
    """Keep where unmapped places occur so the import report can point back to the Excel."""
    if parse_location(location, aliases) is None:
        found = examples.setdefault(location, [])
        if len(found) < 5 and where not in found:
            found.append(where)


def read_undergraduate(rows, headers, semester):
    columns = {label: column for column, label in headers.items()}
    for label in ("已排时间地点", "课程名", "上课教师"):
        if label not in columns:
            raise ValueError(f"未找到“{label}”列")
    aliases = semester.get("buildingAliases", {})
    counts = collections.Counter()
    room_types = {}
    examples = {}
    locations = {}
    courses = []
    for row_number, row in rows:
        if not any(row.values()):
            continue
        counts["courseRows"] += 1
        if not row.get(columns["课程名"], ""):
            raise ValueError(f"第 {row_number} 行：课程名为空")
        text = row.get(columns["已排时间地点"], "")
        try:
            entries = parse_schedules(text, semester["weeks"]) if text else []
        except ValueError as error:
            # Fail the import rather than publish a dataset with silently dropped classes.
            raise ValueError(f"第 {row_number} 行：{error}") from error
        if not text:
            counts["unscheduledRows"] += 1
        course_meetings = {}
        for entry in entries:
            counts["scheduleEntries"] += 1
            location = entry["location"]
            meeting = (entry["day"], entry["periods"], locations.setdefault(location, len(locations)))
            course_meetings[meeting] = course_meetings.get(meeting, 0) | entry["weeks"]
            room_type = row.get(columns.get("教室类型", ""), "")
            if room_type:
                room_types.setdefault(location, room_type)
            note_example(examples, location, row_number, aliases)
        courses.append([
            row.get(columns.get("课程号", ""), ""),
            row.get(columns["课程名"], ""),
            row.get(columns.get("课序号", ""), ""),
            row.get(columns["上课教师"], ""),
            [[key[0], key[1], mask, key[2]] for key, mask in sorted(course_meetings.items())],
        ])
    return {"counts": dict(counts), "roomTypes": room_types, "examples": examples,
            "locations": list(locations), "courses": courses}


def graduate_period(label):
    match = re.fullmatch(r"第(\d+|[一二三四五六七八九十]+)节", label)
    value = match[1] if match else ""
    period = int(value) if value.isdigit() else PERIOD_NAMES.index(value) + 1 if value in PERIOD_NAMES else 0
    if not 1 <= period <= 12:
        raise ValueError(f"无法识别节次：{label or '空'}")
    return period


def graduate_weeks(text, total_weeks):
    """Parse 1-8周, 2-16双周 or 1,3-15双周,16周; returns the mask within the term and
    whether later weeks were dropped. 未安排周次 returns None."""
    if text == "未安排周次":
        return None, False
    if not text.endswith("周"):
        raise ValueError(f"无法识别周次：{text}")
    weeks = set()
    for token in re.split(r"[,，]", text):
        match = GRADUATE_WEEK.fullmatch(token.strip())
        if not match:
            raise ValueError(f"无法识别周次：{text}")
        first, last, parity = match.groups()
        first, last = int(first), int(last or first)
        if not 1 <= first <= last <= 30:
            raise ValueError(f"周次有误：{text}")
        weeks.update(
            week for week in range(first, last + 1)
            if parity is None or week % 2 == (1 if parity == "单" else 0)
        )
    if not weeks:
        raise ValueError(f"周次没有有效上课周：{text}")
    return sum(1 << (week - 1) for week in weeks if week <= total_weeks), max(weeks) > total_weeks


def graduate_location(place):
    """Turn 前卫校区前卫-逸夫楼-301 into 前卫-逸夫楼-301 and 前卫校区★东荣B119 into 前卫校区 东荣B119."""
    place = re.sub(r"\s+", " ", place).strip()
    campus, rest = re.fullmatch(rf"(?:({CAMPUS})校区)?(.*)", place, re.S).groups()
    rest = rest.strip()
    if not campus or re.match(rf"(?:{CAMPUS})-", rest):
        return re.sub(r"\s*★\s*", " ", rest).strip()
    rest = rest.lstrip("★").strip()
    return f"{campus}校区 {rest}" if rest else f"{campus}校区"


def graduate_records(text, total_weeks):
    """Split one cell, where each class reads 课程 [教学班] ⇥⇥ 教师/校区地点 ⇥⇥ 周次."""
    fields = [field.strip() for field in text.split("\t\t") if field.strip()]
    if len(fields) % 3:
        raise ValueError("课程记录无法拆分")
    records = []
    for index in range(0, len(fields), 3):
        title, place, week_text = fields[index:index + 3]
        course = GRADUATE_COURSE.fullmatch(title)
        teacher, slash, place = place.partition("/")
        if not course or not slash:
            raise ValueError(f"课程记录格式有误：{title}")
        name = course["name"].strip()
        records.append((
            name,
            course["section"].strip().removeprefix(name).strip(),
            re.sub(r"\s+", " ", teacher).strip(),
            graduate_location(place),
            *graduate_weeks(week_text, total_weeks),
        ))
    return records


def read_graduate(rows, headers, semester):
    columns = {label: column for column, label in headers.items()}
    days = {
        column: WEEKDAYS.index(label[2].replace("天", "日")) + 1
        for column, label in headers.items() if re.fullmatch(r"星期[一二三四五六日天]", label)
    }
    if not days:
        raise ValueError("研究生课表未找到“星期一”至“星期日”列")
    aliases = semester.get("buildingAliases", {})
    counts = collections.Counter()
    sections = {}
    examples = {}
    for row_number, row in rows:
        if not any(row.values()):
            continue
        try:
            period = graduate_period(row.get(columns["节次/星期"], ""))
        except ValueError as error:
            raise ValueError(f"第 {row_number} 行：{error}") from error
        for column, day in days.items():
            where = f"星期{WEEKDAYS[day - 1]}第{period}节"
            try:
                records = graduate_records(row.get(column, ""), semester["weeks"])
            except ValueError as error:
                raise ValueError(f"{where}：{error}") from error
            for name, section, teacher, location, weeks, beyond in records:
                counts["scheduleEntries"] += 1
                course = (name, section, teacher)
                if weeks is None:
                    counts["unscheduledEntries"] += 1
                    sections.setdefault(course, {})
                    continue
                if beyond:
                    counts["weeksBeyondSemester"] += 1
                if not weeks:
                    continue
                # Cells hold one period each; collect each week's periods to restore 第1—2节-style meetings.
                by_week = sections.setdefault(course, {}).setdefault((day, location), {})
                for week in range(semester["weeks"]):
                    if weeks >> week & 1:
                        by_week[week] = by_week.get(week, 0) | 1 << (period - 1)
                note_example(examples, location, where, aliases)
    locations = {}
    courses = []
    for (name, section, teacher), places in sorted(sections.items()):
        merged = {}
        for (day, location), by_week in places.items():
            for week, periods in by_week.items():
                key = (day, periods, locations.setdefault(location, len(locations)))
                merged[key] = merged.get(key, 0) | 1 << week
        courses.append(["", name, section, teacher,
                        [[key[0], key[1], mask, key[2]] for key, mask in sorted(merged.items())]])
    counts["courses"] = len(courses)
    return {"counts": dict(counts), "roomTypes": {}, "examples": examples,
            "locations": list(locations), "courses": courses}


def read_source(source, semester, imported_at):
    """Read one Excel export into the part stored under data/classroom-sources."""
    validate_semester(semester)
    iso_date(imported_at)
    rows = iter(read_rows(source))
    first = next(rows, None)
    if first is None:
        raise ValueError("Excel 中没有课表数据")
    _, headers = first
    labels = set(headers.values())
    if "已排时间地点" in labels:
        kind, read = "undergraduate", read_undergraduate
    elif "节次/星期" in labels:
        kind, read = "graduate", read_graduate
    else:
        raise ValueError("无法识别课表：本科生课表需含“已排时间地点”列，研究生课表需以“节次/星期”开头")
    part = read(rows, headers, semester)
    return {"kind": kind, "label": source.name, "importedAt": imported_at, "semester": semester["name"], **part}


def build(parts, semester):
    """Merge the stored parts into the published timetable and course catalog."""
    validate_semester(semester)
    aliases = semester.get("buildingAliases", {})
    keys = {location: parse_location(location, aliases) for part in parts for location in part["locations"]}
    match = room_matcher({key for key in keys.values() if key}, aliases)
    keys = {location: key or match(location) for location, key in keys.items()}
    term_weeks = 2 ** semester["weeks"] - 1
    counts = collections.Counter()
    room_types = {}
    occupancy = {}
    locations = {}
    courses = []
    issues = {}
    for part in parts:
        for code, name, section, teacher, meetings in part["courses"]:
            merged = []
            for day, periods, weeks, index in meetings:
                if weeks & ~term_weeks:
                    raise ValueError(f"{KINDS[part['kind']]}课表有超出 {semester['weeks']} 周的安排，请重新导入它的 Excel")
                location = part["locations"][index]
                key = keys[location]
                counts["meetings"] += 1
                if key is None:
                    reason = "missingLocation" if is_missing(location) else "unmappedLocation"
                    counts[reason] += 1
                    issue = issues.setdefault((part["kind"], reason, location), {
                        "source": part["kind"], "reason": reason, "location": location,
                        "count": 0, "examples": part["examples"].get(location, []),
                    })
                    issue["count"] += 1
                else:
                    counts["mappedMeetings"] += 1
                    room_types[key] = room_types.get(key) or part["roomTypes"].get(location, "")
                    slot = (*key, day, periods)
                    occupancy[slot] = occupancy.get(slot, 0) | weeks
                merged.append([day, periods, weeks, locations.setdefault(location, len(locations))])
            courses.append([code, name, section, teacher, merged])
    if not room_types or not occupancy:
        raise ValueError("没有可查询的教室记录")
    room_keys = sorted(room_types, key=lambda key: (CAMPUSES.index(key[0]), key[1], key[2]))
    room_ids = {key: index for index, key in enumerate(room_keys)}
    dataset = {
        "schemaVersion": 1,
        "semester": semester_calendar(semester),
        "importedAt": max(part["importedAt"] for part in parts),
        "source": {
            "label": "；".join(f"{KINDS[part['kind']]}：{part['label']}" for part in parts),
            "courseRows": len(courses),
        },
        "rooms": [[*key, room_types[key]] for key in room_keys],
        "slots": [[room_ids[key[:3]], key[3], key[4], mask] for key, mask in sorted(occupancy.items())],
    }
    course_dataset = {
        "schemaVersion": 1,
        "semester": dataset["semester"],
        "importedAt": dataset["importedAt"],
        "locations": list(locations),
        "courses": courses,
    }
    report = {
        "sources": [{key: part[key] for key in ("kind", "label", "importedAt")} | part["counts"] for part in parts],
        "counts": dict(counts),
        "roomCount": len(room_keys),
        "slotCount": len(occupancy),
        "issues": sorted(issues.values(), key=lambda issue: (list(KINDS).index(issue["source"]), -issue["count"])),
    }
    return dataset, course_dataset, report


DATA_PATH = re.compile(r"/data/classrooms/(?:timetable|courses)-[a-f0-9]{12}\.json")


def read_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise ValueError(f"文件不存在：{path}") from error
    except (json.JSONDecodeError, UnicodeError) as error:
        raise ValueError(f"JSON 文件格式有误：{path}") from error


def json_content(value, compact=False):
    options = {"separators": (",", ":")} if compact else {"indent": 2}
    return (json.dumps(value, ensure_ascii=False, **options) + "\n").encode("utf-8")


def replace_files(outputs):
    """Stage every file before replacement, rolling back on a failed write.

    A None content deletes the file as part of the same change.
    """
    staged = {}
    previous = {}
    modes = {}
    replaced = []
    try:
        for path, content in outputs.items():
            previous[path] = path.read_bytes() if path.exists() else None
            modes[path] = path.stat().st_mode & 0o777 if path.exists() else 0o644
            if content is None:
                continue
            path.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(dir=path.parent, prefix=".timetable-", delete=False) as handle:
                staged[path] = Path(handle.name)
                handle.write(content)
            staged[path].chmod(modes[path])
        # The manifest is last, after both immutable data files are ready.
        for path in outputs:
            if path in staged:
                staged[path].replace(path)
            else:
                path.unlink(missing_ok=True)
            replaced.append(path)
    except BaseException:
        for path in reversed(replaced):
            if previous[path] is None:
                path.unlink(missing_ok=True)
            else:
                with tempfile.NamedTemporaryFile(dir=path.parent, prefix=".timetable-", delete=False) as handle:
                    restore = Path(handle.name)
                    handle.write(previous[path])
                restore.chmod(modes[path])
                restore.replace(path)
        raise
    finally:
        for temporary in staged.values():
            temporary.unlink(missing_ok=True)


def publish(root, dataset, course_dataset, semester, report=None, parts=None):
    """Write the merged data; parts maps a kind to its new part, or None to remove it."""
    manifest_path = root / "src/features/tools/data/classroom-data.json"
    previous = read_json(manifest_path) if manifest_path.exists() else {}
    if not isinstance(previous, dict):
        raise ValueError("课表索引文件格式有误")
    outputs = {}
    manifest = {}
    for kind, key, data in (("timetable", "url", dataset), ("courses", "coursesUrl", course_dataset)):
        content = json_content(data, compact=True)
        digest = hashlib.sha256(content).hexdigest()[:12]
        relative = f"/data/classrooms/{kind}-{digest}.json"
        manifest[key] = relative
        outputs[root / "public" / relative.lstrip("/")] = content
    for kind, part in (parts or {}).items():
        outputs[root / SOURCES / f"{kind}.json"] = None if part is None else json_content(part, compact=True)
    if report is not None:
        outputs[root / "data/classroom-import-report.json"] = json_content(report)
    outputs[root / "data/classroom-semester.json"] = json_content(semester)
    outputs[manifest_path] = json_content(manifest)
    replace_files(outputs)
    for old in previous.values():
        if isinstance(old, str) and old not in manifest.values() and DATA_PATH.fullmatch(old):
            try:
                (root / "public" / old.lstrip("/")).unlink(missing_ok=True)
            except OSError:
                # Published data are valid even if an obsolete file cannot be removed.
                pass
    return manifest


def load_parts(root):
    parts = {}
    for kind, label in KINDS.items():
        path = root / SOURCES / f"{kind}.json"
        if not path.exists():
            continue
        part = read_json(path)
        if not isinstance(part, dict) or part.get("kind") != kind or any(
            not isinstance(part.get(key), list) for key in ("locations", "courses")
        ) or any(not isinstance(part.get(key), dict) for key in ("counts", "roomTypes", "examples")):
            raise ValueError(f"{label}课表数据有误，请重新导入它的 Excel")
        parts[kind] = part
    return parts


def load_current(root):
    manifest = read_json(root / "src/features/tools/data/classroom-data.json")
    if not isinstance(manifest, dict) or any(
        not isinstance(manifest.get(key), str) or not DATA_PATH.fullmatch(manifest[key])
        for key in ("url", "coursesUrl")
    ):
        raise ValueError("课表索引文件格式有误，请重新导入 Excel")
    dataset, courses = [read_json(root / "public" / manifest[key].lstrip("/"))
                        for key in ("url", "coursesUrl")]
    if any(not isinstance(value, dict) or value.get("schemaVersion") != 1
           for value in (dataset, courses)) or any(
        not isinstance(value.get(key), list) or not value[key]
        for value, key in ((dataset, "rooms"), (dataset, "slots"), (courses, "courses"))
    ):
        raise ValueError("当前课表数据有误，请重新导入 Excel")
    if dataset.get("semester") != courses.get("semester"):
        raise ValueError("空教室与蹭课的学期不一致，请重新导入 Excel")
    return dataset, courses


def source_path(text):
    """Accept quoted paths and macOS Terminal's escaped drag-and-drop paths."""
    text = text.strip()
    direct = Path(text).expanduser()
    if direct.is_file():
        return direct
    try:
        parts = shlex.split(text)
    except ValueError:
        parts = []
    if len(parts) == 1:
        return Path(parts[0]).expanduser()
    return direct


def load_semester(root, args):
    path = getattr(args, "semester", None) or root / "data/classroom-semester.json"
    semester = copy.deepcopy(read_json(path))
    if not isinstance(semester, dict):
        raise ValueError("学期配置必须为 JSON 对象")
    for argument, key in (("start", "firstWeekMonday"), ("weeks", "weeks"), ("name", "name")):
        value = getattr(args, argument, None)
        if value is not None:
            semester[key] = value
    semester.setdefault("firstWeekMonday", None)
    semester.setdefault("dateOverrides", {})
    if getattr(args, "reset_overrides", False):
        semester["dateOverrides"] = {}
    validate_semester(semester)
    return semester


def print_summary(semester, dataset, courses, parts):
    print(f"学期：{semester['name']}")
    print(f"第一教学周周一：{semester['firstWeekMonday'] or '未设置（仅按周次查询）'}")
    print(f"教学周数：{semester['weeks']}；调休/停课日期：{len(semester.get('dateOverrides', {}))} 个")
    for part in parts:
        print(f"{KINDS[part['kind']]}课表：{part['label']}，导入于 {part['importedAt']}，{len(part['courses'])} 个教学班")
    print(f"可查询教室：{len(dataset['rooms'])}；课程教学班：{len(courses['courses'])}")


def run_update(root, args):
    semester = load_semester(root, args)
    imported_at = args.imported_at or dt.datetime.now(dt.timezone(dt.timedelta(hours=8))).date().isoformat()
    imported = {}
    for text in args.sources:
        source = source_path(text)
        if not source.is_file():
            raise ValueError(f"Excel 文件不存在：{source}")
        if source.suffix.lower() != ".xlsx":
            raise ValueError("只支持 .xlsx 文件；请先将 .xls 另存为 .xlsx")
        part = read_source(source, semester, imported_at)
        if part["kind"] in imported:
            raise ValueError(f"同时传入了两份{KINDS[part['kind']]}课表")
        imported[part["kind"]] = part
    current = load_parts(root)
    # A renamed semester means the export not passed in again belongs to the previous term.
    dropped = [kind for kind, part in current.items() if kind not in imported and part.get("semester") != semester["name"]]
    parts = [imported.get(kind) or current[kind] for kind in KINDS
             if kind in imported or (kind in current and kind not in dropped)]
    dataset, courses, report = build(parts, semester)
    if not args.dry_run:
        publish(root, dataset, courses, semester, report, {**imported, **dict.fromkeys(dropped)})
    print("校验通过，未写入文件。" if args.dry_run else "已更新 Excel，并同步空教室与蹭课数据。")
    for kind, part in imported.items():
        print(f"已识别为{KINDS[kind]}课表：{part['label']}")
    for kind in dropped:
        print(f"学期已改为“{semester['name']}”，旧学期的{KINDS[kind]}课表（{current[kind]['label']}）不再使用；新课表发布后运行 update 加入。")
    print_summary(semester, dataset, courses, parts)
    for kind, part in imported.items():
        beyond = part["counts"].get("weeksBeyondSemester", 0)
        if beyond:
            print(f"{KINDS[kind]}课表有 {beyond} 条安排排到第 {semester['weeks']} 周以后，超出的周次未计入；需要时用 --weeks 加大教学周数。")
    issues = report["counts"].get("missingLocation", 0) + report["counts"].get("unmappedLocation", 0)
    if issues:
        print(f"有 {issues} 条上课安排未映射到教室；{'正式导入后' if args.dry_run else ''}请查看 data/classroom-import-report.json。")


def run_date(root, args):
    semester = load_semester(root, args)
    parts = list(load_parts(root).values())
    if not parts:
        raise ValueError("尚未导入课表，请先运行 update")
    # A date-only edit must not silently change a manually edited term length/name.
    previous = load_current(root)[0]["semester"]
    if semester["weeks"] != previous["weeks"] or semester["name"] != previous["name"]:
        raise ValueError("学期名称或周数已被手动修改，请使用 update 重新导入 Excel；date 仅修改日期与调休表")
    dataset, courses, _report = build(parts, semester)
    if not args.dry_run:
        publish(root, dataset, courses, semester)
    print("日期校验通过，未写入文件。" if args.dry_run else "已修改开学日期，并同步空教室与蹭课数据；无需重新导入 Excel。")
    print_summary(semester, dataset, courses, parts)


def run_status(root, _args):
    semester = load_semester(root, argparse.Namespace())
    parts = list(load_parts(root).values())
    if not parts or not (root / "src/features/tools/data/classroom-data.json").exists():
        print(f"当前配置：{semester['name']}，第一教学周周一 {semester['firstWeekMonday'] or '未设置'}。")
        print("尚未导入课表，运行 npm run timetable 开始。")
        return
    dataset, courses = load_current(root)
    print_summary(semester, dataset, courses, parts)
    if semester_calendar(semester) != dataset["semester"]:
        print("配置与生成数据尚未同步，请运行 update 重新导入，或使用 date 更新日期。")
    print(f"配置文件：{root / 'data/classroom-semester.json'}")


def wizard(root, parser):
    print("\n向北课表管理\n")
    run_status(root, argparse.Namespace())
    print("\n1. 更换 Excel（本科生或研究生课表，可同时修改开学日期、名称和周数）\n2. 只修改开学日期（不需要 Excel）\n3. 查看当前配置\n0. 退出\n")
    choice = input("请选择 [1]：").strip() or "1"
    if choice == "0":
        return None
    if choice == "3":
        return parser.parse_args(["status"])
    if choice not in ("1", "2"):
        raise ValueError("请选择 0、1、2 或 3")
    semester = load_semester(root, argparse.Namespace())
    values = ["update" if choice == "1" else "date"]
    if choice == "1":
        source = input("Excel 路径（可拖入终端，自动识别本科生/研究生课表）：").strip()
        if not source:
            raise ValueError("请输入 Excel 路径")
        values.append(source)
    start = input(f"第一教学周周一，YYYY-MM-DD [{semester['firstWeekMonday'] or '必填'}]：").strip() or semester["firstWeekMonday"]
    if not start:
        raise ValueError("请输入第一教学周周一")
    values += ["--start", start] if choice == "1" else [start]
    if choice == "1":
        name = input(f"学期名称 [{semester['name']}]：").strip() or semester["name"]
        weeks = input(f"教学周数 [{semester['weeks']}]：").strip() or str(semester["weeks"])
        values += ["--name", name, "--weeks", weeks]
    if semester.get("dateOverrides") and start != semester["firstWeekMonday"]:
        reset = input("开学日期有变，清空旧学期的调休/停课设置？[Y/n]：").strip().lower()
        if reset not in ("n", "no"):
            values.append("--reset-overrides")
    return parser.parse_args(values)


def build_parser():
    parser = argparse.ArgumentParser(description=__doc__, epilog="不传参数进入交互菜单。更新后运行 npm run build，按官网现有流程发布。")
    commands = parser.add_subparsers(dest="command", title="命令")
    update = commands.add_parser("update", help="更换 Excel，可同时修改学期设置")
    update.add_argument("sources", nargs="+", metavar="source",
                        help="本科生或研究生课表 .xlsx 路径，可一次传入两份（含空格时用引号包住）；未传入的另一份沿用当前数据")
    update.add_argument("--start", "--start-date", help="第一教学周周一，格式 YYYY-MM-DD；省略则沿用当前值")
    update.add_argument("--weeks", type=int, help="教学周数，1—30；省略则沿用当前值")
    update.add_argument("--name", help="学期显示名称；省略则沿用当前值。改名视为换学期，未一并传入的课表不再使用")
    update.add_argument("--semester", type=Path, help="使用另一份学期 JSON 配置（保留兼容旧导入命令）")
    update.add_argument("--imported-at", help="Excel 导入日期 YYYY-MM-DD；默认中国当天日期")
    date = commands.add_parser("date", help="仅修改开学日期，无需 Excel")
    date.add_argument("start", help="第一教学周周一，格式 YYYY-MM-DD")
    for command in (update, date):
        command.add_argument("--reset-overrides", action="store_true", help="同时清空旧学期的调休/停课表；默认保留")
        command.add_argument("--dry-run", action="store_true", help="仅校验、预览结果，不写入任何文件")
    commands.add_parser("status", help="查看当前学期、Excel 来源和数据量")
    commands.add_parser("wizard", help="进入交互菜单（与不传参数相同）")
    return parser


def main(argv=None, root=ROOT):
    parser = build_parser()
    arguments = list(sys.argv[1:] if argv is None else argv)
    # Keep the original `python3 scripts/import-classrooms.py file.xlsx` working.
    if arguments and arguments[0] not in ("update", "date", "status", "wizard") and not arguments[0].startswith("-"):
        arguments.insert(0, "update")
    args = parser.parse_args(arguments)
    try:
        if args.command in (None, "wizard"):
            if not sys.stdin.isatty():
                parser.print_help()
                return 0
            args = wizard(root, parser)
            if args is None:
                return 0
        {"update": run_update, "date": run_date, "status": run_status}[args.command](root, args)
        if args.command in ("update", "date") and not args.dry_run:
            print("\n本地预览：npm run dev\n上线：npm run build 后按官网现有流程发布。CLI 不会自动发布。")
        return 0
    except (ValueError, OSError, zipfile.BadZipFile, ET.ParseError, KeyError, StopIteration) as error:
        print(f"操作失败：{error}", file=sys.stderr)
        return 1
    except (KeyboardInterrupt, EOFError):
        print("\n已取消。", file=sys.stderr)
        return 130


if __name__ == "__main__":
    sys.exit(main())
