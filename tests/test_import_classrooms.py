import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("import_classrooms", Path(__file__).resolve().parents[1] / "scripts/import-classrooms.py")
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


class ImportClassroomsTest(unittest.TestCase):
    def test_course_catalog_keeps_unknown_locations_and_unpublished_times(self):
        semester = {"name": "测试", "firstWeekMonday": "2026-09-07", "weeks": 18, "dateOverrides": {}}
        rows = [
            (1, {"A": "课程号", "B": "课程名", "C": "课序号", "G": "上课教师", "I": "已排时间地点"}),
            (2, {"A": "a", "B": "测试课程", "C": "01", "G": "张三", "I": "1周 星期一 1-2节 前卫-逸夫楼-101,3周 星期一 1-2节 前卫-逸夫楼-101,2周 星期二 3-4节 401实验室"}),
            (3, {"A": "b", "B": "未排课程", "C": "01", "G": "李四", "I": ""}),
        ]
        with patch.object(importer, "read_rows", return_value=iter(rows)):
            occupancy, catalog, report = importer.convert(Path("fixture.xlsx"), semester, "2026-10-25")
        self.assertEqual(catalog["courses"][0][1:4], ["测试课程", "01", "张三"])
        self.assertEqual(catalog["courses"][0][4][0][2], 5)
        self.assertEqual(len(catalog["courses"][0][4]), 2)
        self.assertIn("401实验室", catalog["locations"])
        self.assertEqual(catalog["courses"][1][4], [])
        self.assertNotIn("courses", occupancy)
        self.assertEqual(report["counts"]["unmappedLocation"], 1)

    def test_single_weeks_parity_and_disjoint_ranges(self):
        mask = importer.parse_weeks("3周,5-9周(单),14-18周(双)", 18)
        self.assertEqual([week for week in range(1, 19) if mask & (1 << (week - 1))], [3, 5, 7, 9, 14, 16, 18])
        for invalid in ["0周", "19周", "8-3周", "3-3周(双)", "未知"]:
            with self.assertRaises(ValueError):
                importer.parse_weeks(invalid, 18)

    def test_week_commas_belong_to_the_following_time_location(self):
        entries = importer.parse_schedules("3-14周,17-18周 星期二 第1节-第2节 前卫-第三教学楼-407,15-16周 星期二 第1节-第4节 前卫-第三教学楼-407", 18)
        self.assertEqual(len(entries), 2)
        self.assertTrue(entries[0]["weeks"] & (1 << 2))
        self.assertTrue(entries[0]["weeks"] & (1 << 17))
        self.assertFalse(entries[0]["weeks"] & (1 << 14))
        self.assertEqual(entries[1]["periods"], 15)

    def test_abbreviated_periods_and_commas_inside_location_notes(self):
        entries = importer.parse_schedules("2周 星期一 7-8节 新民-第二教学楼-2201（二年级，三教班优先）,3周 星期三 1-2节 新民-第二教学楼-2201", 18)
        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0]["periods"], 192)
        self.assertEqual(importer.parse_location(entries[0]["location"], {}), ("新民", "第二教学楼", "2201"))

    def test_room_identity_preserves_numbered_language_labs_and_combines_priority_notes(self):
        self.assertEqual(importer.parse_location("前卫-外语楼-语音室(三)", {}), ("前卫", "外语楼", "语音室(三)"))
        self.assertEqual(importer.parse_location("前卫-李四光楼-302(地学优先)", {}), ("前卫", "李四光楼", "302"))
        self.assertEqual(importer.parse_location("前卫-敬信教学楼-E区209-B2日新课堂", {}), ("前卫", "敬信教学楼", "E区209"))
        self.assertEqual(importer.parse_location("南岭-(一)101", {"南岭": {"(一)": "第一教学楼"}}), ("南岭", "第一教学楼", "101"))
        self.assertIsNone(importer.parse_location("401实验室", {}))
        self.assertIsNone(importer.parse_location("线上教学-前卫", {}))

    def test_missing_location_is_explicit_and_unrecognized_time_fails(self):
        entries = importer.parse_schedules("1-2周 星期一 第1节-第4节,3周 星期二 1-2节 前卫-逸夫楼-101", 18)
        self.assertEqual(entries[0]["location"], "")
        with self.assertRaises(ValueError):
            importer.parse_schedules("3周 不明时间 前卫-逸夫楼-101", 18)


if __name__ == "__main__":
    unittest.main()
