"""管理空教室与蹭课课表：交互更新 Excel、修改开学日期、查看当前配置。

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
WEEK = r"\d+(?:-\d+)?周(?:[（(][单双][）)])?"
SCHEDULE = re.compile(
    rf"(?P<weeks>{WEEK}(?:\s*[,，]\s*{WEEK})*)\s*"
    r"星期(?P<day>[一二三四五六日天])\s*"
    r"(?:第)?(?P<start>\d+)(?:节)?-(?:第)?(?P<end>\d+)节"
)
WEEK_TOKEN = re.compile(r"^(\d+)(?:-(\d+))?周(?:[（(]([单双])[）)])?$")
ROOM_NOTE = re.compile(r"[（(](?=[^）)]*(?:优先|教班|教学班|年级|专用))")


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
            "day": "一二三四五六日".index(match["day"].replace("天", "日")) + 1,
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
    building = aliases.get(campus, {}).get(building.strip(), building.strip())
    room = ROOM_NOTE.split(room, maxsplit=1)[0].strip()
    # A hyphen after the room identifies a named teaching space in this export.
    room = room.split("-", 1)[0].strip()
    if not building or not room or building == "第":
        return None
    return campus, building, room


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


def convert(source, semester, imported_at):
    validate_semester(semester)
    iso_date(imported_at)
    rows = iter(read_rows(source))
    first = next(rows, None)
    if first is None:
        raise ValueError("Excel 中没有课表数据")
    _, headers = first
    columns = {label: column for column, label in headers.items()}
    for label in ("已排时间地点", "课程名", "上课教师"):
        if label not in columns:
            raise ValueError(f"未找到“{label}”列")
    counts = collections.Counter()
    room_types = {}
    occupancy = {}
    courses = []
    locations = {}
    issues = []
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
            if location not in locations:
                locations[location] = len(locations)
            meeting = (entry["day"], entry["periods"], locations[location])
            course_meetings[meeting] = course_meetings.get(meeting, 0) | entry["weeks"]
            key = parse_location(location, semester.get("buildingAliases", {}))
            if key is None:
                reason = "missingLocation" if not location else "unmappedLocation"
                counts[reason] += 1
                issues.append({"row": row_number, "reason": reason, "location": location})
                continue
            counts["mappedEntries"] += 1
            room_type = row.get(columns.get("教室类型", ""), "")
            room_types[key] = room_types.get(key) or room_type
            slot = (*key, entry["day"], entry["periods"])
            occupancy[slot] = occupancy.get(slot, 0) | entry["weeks"]
        courses.append([
            row.get(columns.get("课程号", ""), ""),
            row.get(columns["课程名"], ""),
            row.get(columns.get("课序号", ""), ""),
            row.get(columns["上课教师"], ""),
            [[key[0], key[1], mask, key[2]] for key, mask in sorted(course_meetings.items())],
        ])
    if not room_types or not occupancy:
        raise ValueError("没有可查询的教室记录")
    room_keys = sorted(room_types, key=lambda key: (CAMPUSES.index(key[0]), key[1], key[2]))
    room_ids = {key: index for index, key in enumerate(room_keys)}
    dataset = {
        "schemaVersion": 1,
        "semester": semester_calendar(semester),
        "importedAt": imported_at,
        "source": {"label": source.name, **dict(counts)},
        "rooms": [[*key, room_types[key]] for key in room_keys],
        "slots": [[room_ids[key[:3]], key[3], key[4], mask] for key, mask in sorted(occupancy.items())],
    }
    course_dataset = {
        "schemaVersion": 1,
        "semester": dataset["semester"],
        "importedAt": imported_at,
        "locations": list(locations),
        "courses": courses,
    }
    grouped_issues = {}
    for issue in issues:
        key = (issue["reason"], issue["location"])
        group = grouped_issues.setdefault(key, {"reason": key[0], "location": key[1], "count": 0, "exampleRows": []})
        group["count"] += 1
        if len(group["exampleRows"]) < 5 and issue["row"] not in group["exampleRows"]:
            group["exampleRows"].append(issue["row"])
    report = {"counts": dict(counts), "roomCount": len(room_keys), "slotCount": len(occupancy), "issues": list(grouped_issues.values())}
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
    """Stage every file before replacement, rolling back on a failed write."""
    staged = {}
    previous = {}
    modes = {}
    replaced = []
    try:
        for path, content in outputs.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            previous[path] = path.read_bytes() if path.exists() else None
            modes[path] = path.stat().st_mode & 0o777 if path.exists() else 0o644
            with tempfile.NamedTemporaryFile(dir=path.parent, prefix=".timetable-", delete=False) as handle:
                staged[path] = Path(handle.name)
                handle.write(content)
            staged[path].chmod(modes[path])
        # The manifest is last, after both immutable data files are ready.
        for path, temporary in staged.items():
            temporary.replace(path)
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


def publish(root, dataset, course_dataset, semester, report=None):
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


def print_summary(semester, dataset, courses):
    print(f"学期：{semester['name']}")
    print(f"第一教学周周一：{semester['firstWeekMonday'] or '未设置（仅按周次查询）'}")
    print(f"教学周数：{semester['weeks']}；调休/停课日期：{len(semester.get('dateOverrides', {}))} 个")
    print(f"Excel：{dataset.get('source', {}).get('label', '未记录')}")
    print(f"导入日期：{dataset.get('importedAt', '未记录')}")
    print(f"可查询教室：{len(dataset['rooms'])}；课程教学班：{len(courses['courses'])}")


def run_update(root, args):
    semester = load_semester(root, args)
    source = source_path(args.source)
    if not source.is_file():
        raise ValueError(f"Excel 文件不存在：{source}")
    if source.suffix.lower() != ".xlsx":
        raise ValueError("只支持 .xlsx 文件；请先将 .xls 另存为 .xlsx")
    imported_at = args.imported_at or dt.datetime.now(dt.timezone(dt.timedelta(hours=8))).date().isoformat()
    dataset, courses, report = convert(source, semester, imported_at)
    if not args.dry_run:
        publish(root, dataset, courses, semester, report)
    print("校验通过，未写入文件。" if args.dry_run else "已更新 Excel，并同步空教室与蹭课数据。")
    print_summary(semester, dataset, courses)
    issues = report["counts"].get("missingLocation", 0) + report["counts"].get("unmappedLocation", 0)
    if issues:
        print(f"有 {issues} 条时间地点记录未映射到教室；{'正式导入后' if args.dry_run else ''}请查看 data/classroom-import-report.json。")


def run_date(root, args):
    semester = load_semester(root, args)
    dataset, courses = load_current(root)
    # A date-only edit must not silently change a manually edited term length/name.
    previous = dataset["semester"]
    if semester["weeks"] != previous["weeks"] or semester["name"] != previous["name"]:
        raise ValueError("学期名称或周数已被手动修改，请使用 update 重新导入 Excel；date 仅修改日期与调休表")
    dataset["semester"] = semester_calendar(semester)
    courses["semester"] = semester_calendar(semester)
    if not args.dry_run:
        publish(root, dataset, courses, semester)
    print("日期校验通过，未写入文件。" if args.dry_run else "已修改开学日期，并同步空教室与蹭课数据；无需重新导入 Excel。")
    print_summary(semester, dataset, courses)


def run_status(root, _args):
    semester = load_semester(root, argparse.Namespace())
    if not (root / "src/features/tools/data/classroom-data.json").exists():
        print(f"当前配置：{semester['name']}，第一教学周周一 {semester['firstWeekMonday'] or '未设置'}。")
        print("尚未导入课表，运行 npm run timetable 开始。")
        return
    dataset, courses = load_current(root)
    print_summary(semester, dataset, courses)
    if semester_calendar(semester) != dataset["semester"]:
        print("配置与生成数据尚未同步，请运行 update 重新导入，或使用 date 更新日期。")
    print(f"配置文件：{root / 'data/classroom-semester.json'}")


def wizard(root, parser):
    print("\n向北课表管理\n")
    run_status(root, argparse.Namespace())
    print("\n1. 更换 Excel（可同时修改开学日期、名称和周数）\n2. 只修改开学日期（不需要 Excel）\n3. 查看当前配置\n0. 退出\n")
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
        source = input("Excel 路径（可拖入终端）：").strip()
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
    update.add_argument("source", help="学生课程表 .xlsx 路径（含空格时用引号包住）")
    update.add_argument("--start", "--start-date", help="第一教学周周一，格式 YYYY-MM-DD；省略则沿用当前值")
    update.add_argument("--weeks", type=int, help="教学周数，1—30；省略则沿用当前值")
    update.add_argument("--name", help="学期显示名称；省略则沿用当前值")
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
