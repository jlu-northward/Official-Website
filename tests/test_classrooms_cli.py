import contextlib
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import shlex
import tempfile
import unittest
from unittest.mock import patch
import xml.etree.ElementTree as ET
import zipfile


spec = importlib.util.spec_from_file_location(
    "classrooms_cli", Path(__file__).resolve().parents[1] / "scripts/import-classrooms.py"
)
cli = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cli)


def write_workbook(path, course="数学分析", schedule="1-4周 星期一 1-2节 前卫-逸夫楼-101"):
    namespace = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    sheet = ET.Element("worksheet", xmlns=namespace)
    # Match the real export's incorrect dimension rather than relying on it.
    ET.SubElement(sheet, "dimension", ref="A1")
    sheet_data = ET.SubElement(sheet, "sheetData")
    rows = [
        ["课程号", "课程名", "课序号", "上课教师", "已排时间地点"],
        ["math", course, "01", "张三", schedule],
        ["lab", "未排课程", "02", "李四", ""],
    ]
    for number, values in enumerate(rows, 1):
        row = ET.SubElement(sheet_data, "row", r=str(number))
        for column, text in zip("ABCDE", values):
            cell = ET.SubElement(row, "c", r=f"{column}{number}", t="inlineStr")
            ET.SubElement(ET.SubElement(cell, "is"), "t").text = text
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr("xl/workbook.xml", f'<workbook xmlns="{namespace}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="全校课程表" sheetId="1" r:id="rId1"/></sheets></workbook>')
        archive.writestr("xl/_rels/workbook.xml.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')
        archive.writestr("xl/worksheets/sheet1.xml", ET.tostring(sheet, encoding="utf-8"))


class ClassroomsCliTest(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.folder = Path(temporary.name)
        self.root = self.folder / "website"
        (self.root / "data").mkdir(parents=True)
        self.config = {
            "name": "旧学期",
            "firstWeekMonday": "2026-09-07",
            "weeks": 18,
            "dateOverrides": {"2026-09-12": {"week": 1, "weekday": 3}},
            "buildingAliases": {"前卫": {"东荣": "东荣大厦"}},
        }
        (self.root / "data/classroom-semester.json").write_text(
            json.dumps(self.config, ensure_ascii=False), encoding="utf-8"
        )
        self.source = self.folder / "全校课程表 (更新版).xlsx"
        write_workbook(self.source)
        code, _output, error = self.run_cli("update", str(self.source), "--imported-at", "2026-10-25")
        self.assertEqual(code, 0, error)

    def run_cli(self, *arguments):
        output, errors = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(errors):
            result = cli.main(arguments, root=self.root)
        return result, output.getvalue(), errors.getvalue()

    def snapshot(self):
        return {str(path.relative_to(self.root)): path.read_bytes()
                for path in self.root.rglob("*") if path.is_file()}

    def current(self):
        manifest = cli.read_json(self.root / "src/features/tools/data/classroom-data.json")
        room_data, courses = cli.load_current(self.root)
        config = cli.read_json(self.root / "data/classroom-semester.json")
        return manifest, room_data, courses, config

    def test_update_reads_xlsx_updates_both_calendars_and_cleans_only_old_generated_files(self):
        previous = self.current()[0]
        keep = self.root / "public/data/classrooms/notes.json"
        keep.write_text("keep", encoding="utf-8")
        write_workbook(self.source, course="离散数学", schedule="2-8周(双) 星期二 3-4节 前卫-逸夫楼-102")
        code, output, error = self.run_cli(
            "update", str(self.source), "--start", "2027-03-01", "--weeks", "20",
            "--name", "2026—2027 第二学期", "--reset-overrides", "--imported-at", "2027-02-25",
        )
        self.assertEqual(code, 0, error)
        self.assertIn("已更新 Excel", output)
        manifest, rooms, courses, config = self.current()
        self.assertEqual(config["firstWeekMonday"], "2027-03-01")
        self.assertEqual(config["weeks"], 20)
        self.assertEqual(config["name"], "2026—2027 第二学期")
        self.assertEqual(config["dateOverrides"], {})
        self.assertEqual(config["buildingAliases"], self.config["buildingAliases"])
        self.assertEqual(rooms["semester"], courses["semester"])
        self.assertEqual(rooms["semester"], cli.semester_calendar(config))
        self.assertEqual(rooms["importedAt"], "2027-02-25")
        self.assertEqual(courses["courses"][0][1], "离散数学")
        self.assertEqual(len(courses["courses"]), 2)
        self.assertEqual(rooms["rooms"][0][2], "102")
        for relative in manifest.values():
            path = self.root / "public" / relative.lstrip("/")
            self.assertIn(hashlib.sha256(path.read_bytes()).hexdigest()[:12], relative)
            self.assertEqual(path.stat().st_mode & 0o777, 0o644)
        for relative in previous.values():
            self.assertFalse((self.root / "public" / relative.lstrip("/")).exists())
        self.assertEqual(keep.read_text(), "keep")

    def test_date_without_original_excel_preserves_classes_and_import_date(self):
        self.source.unlink()
        old_manifest, old_rooms, old_courses, _config = self.current()
        old_report = (self.root / "data/classroom-import-report.json").read_bytes()
        code, output, error = self.run_cli("date", "2026-09-14")
        self.assertEqual(code, 0, error)
        self.assertIn("无需重新导入 Excel", output)
        manifest, rooms, courses, config = self.current()
        self.assertNotEqual(manifest, old_manifest)
        self.assertEqual(config["firstWeekMonday"], "2026-09-14")
        self.assertEqual(config["dateOverrides"], self.config["dateOverrides"])
        self.assertEqual(rooms["semester"], courses["semester"])
        self.assertEqual(rooms["semester"], cli.semester_calendar(config))
        self.assertEqual({k: v for k, v in rooms.items() if k != "semester"},
                         {k: v for k, v in old_rooms.items() if k != "semester"})
        self.assertEqual({k: v for k, v in courses.items() if k != "semester"},
                         {k: v for k, v in old_courses.items() if k != "semester"})
        self.assertEqual((self.root / "data/classroom-import-report.json").read_bytes(), old_report)

    def test_invalid_inputs_leave_all_current_files_unchanged(self):
        before = self.snapshot()
        invalid_zip = self.folder / "损坏.xlsx"
        invalid_zip.write_text("not an excel", encoding="utf-8")
        bad_time = self.folder / "不支持的时间.xlsx"
        write_workbook(bad_time, schedule="1-4周 星期一 时间待定 前卫-逸夫楼-101")
        for arguments in [
            ("date", "2026-09-08"),
            ("date", "2026-02-30"),
            ("date", "20260907"),
            ("update", str(self.folder / "不存在.xlsx"), "--start", "2027-03-01"),
            ("update", str(invalid_zip)),
            ("update", str(bad_time), "--start", "2027-03-01"),
            ("update", str(self.source), "--weeks", "1"),
            ("update", str(self.source), "--imported-at", "2026-02-30"),
        ]:
            with self.subTest(arguments=arguments):
                code, _output, error = self.run_cli(*arguments)
                self.assertEqual(code, 1)
                self.assertIn("操作失败", error)
                self.assertEqual(self.snapshot(), before)

    def test_dry_run_and_status_do_not_write_files(self):
        before = self.snapshot()
        for arguments in [
            ("update", str(self.source), "--start", "2027-03-01", "--dry-run"),
            ("date", "2027-03-01", "--reset-overrides", "--dry-run"),
            ("status",),
        ]:
            code, output, error = self.run_cli(*arguments)
            self.assertEqual(code, 0, error)
            self.assertIn("第一教学周周一", output)
            self.assertEqual(self.snapshot(), before)

    def test_default_wizard_accepts_escaped_drag_path_and_clears_old_overrides(self):
        escaped_path = str(self.source).replace(" ", "\\ ").replace("(", "\\(").replace(")", "\\)")
        answers = ["1", escaped_path, "2027-03-01", "新学期", "20", ""]
        with patch.object(cli.sys.stdin, "isatty", return_value=True), patch("builtins.input", side_effect=answers):
            code, output, error = self.run_cli()
        self.assertEqual(code, 0, error)
        self.assertIn("已更新 Excel", output)
        config = self.current()[3]
        self.assertEqual(config["dateOverrides"], {})
        self.assertEqual(config["firstWeekMonday"], "2027-03-01")
        self.assertEqual(config["name"], "新学期")

    def test_legacy_command_and_shell_quoted_path_are_supported(self):
        code, _output, error = self.run_cli(shlex.quote(str(self.source)), "--start-date", "2027-03-01")
        self.assertEqual(code, 0, error)
        self.assertEqual(self.current()[3]["firstWeekMonday"], "2027-03-01")

    def test_date_wizard_does_not_need_the_original_excel(self):
        self.source.unlink()
        with patch.object(cli.sys.stdin, "isatty", return_value=True), patch(
            "builtins.input", side_effect=["2", "2027-03-01", ""]
        ):
            code, output, error = self.run_cli()
        self.assertEqual(code, 0, error)
        self.assertIn("无需重新导入 Excel", output)
        self.assertEqual(self.current()[3]["firstWeekMonday"], "2027-03-01")
        self.assertEqual(self.current()[3]["dateOverrides"], {})

    def test_failed_manifest_replacement_rolls_back_all_output_files(self):
        before = self.snapshot()
        original_replace = Path.replace
        failed = False

        def fail_manifest_once(path, destination):
            nonlocal failed
            if destination.name == "classroom-data.json" and not failed:
                failed = True
                raise OSError("simulated disk error")
            return original_replace(path, destination)

        with patch.object(Path, "replace", fail_manifest_once):
            code, _output, error = self.run_cli("date", "2027-03-01")
        self.assertEqual(code, 1)
        self.assertIn("simulated disk error", error)
        self.assertEqual(self.snapshot(), before)


if __name__ == "__main__":
    unittest.main()
