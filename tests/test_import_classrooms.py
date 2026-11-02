import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("import_classrooms", Path(__file__).resolve().parents[1] / "scripts/import-classrooms.py")
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)

SEMESTER = {"name": "测试", "firstWeekMonday": "2026-09-07", "weeks": 18, "dateOverrides": {}}


def read(rows, semester=SEMESTER):
    with patch.object(importer, "read_rows", return_value=iter(rows)):
        return importer.read_source(Path("fixture.xlsx"), semester, "2026-10-25")


def graduate_cell(*records):
    return "".join(f"{title} \t\t{place}\t\t{weeks}\t \t\t" for title, place, weeks in records)


def weeks_of(mask):
    return [week for week in range(1, 31) if mask & (1 << (week - 1))]


class ImportClassroomsTest(unittest.TestCase):
    def test_course_catalog_keeps_unknown_locations_and_unpublished_times(self):
        rows = [
            (1, {"A": "课程号", "B": "课程名", "C": "课序号", "G": "上课教师", "I": "已排时间地点"}),
            (2, {"A": "a", "B": "测试课程", "C": "01", "G": "张三", "I": "1周 星期一 1-2节 前卫-逸夫楼-101,3周 星期一 1-2节 前卫-逸夫楼-101,2周 星期二 3-4节 401实验室"}),
            (3, {"A": "b", "B": "未排课程", "C": "01", "G": "李四", "I": ""}),
        ]
        part = read(rows)
        occupancy, catalog, report = importer.build([part], SEMESTER)
        self.assertEqual(part["kind"], "undergraduate")
        self.assertEqual(catalog["courses"][0][1:4], ["测试课程", "01", "张三"])
        self.assertEqual(catalog["courses"][0][4][0][2], 5)
        self.assertEqual(len(catalog["courses"][0][4]), 2)
        self.assertIn("401实验室", catalog["locations"])
        self.assertEqual(catalog["courses"][1][4], [])
        self.assertNotIn("courses", occupancy)
        self.assertEqual(occupancy["source"]["courseRows"], 2)
        self.assertEqual(report["counts"]["unmappedLocation"], 1)
        self.assertEqual(report["issues"][0]["examples"], [2])

    def test_graduate_grid_joins_periods_and_only_maps_free_text_to_known_rooms(self):
        undergraduate = read([
            (1, {"B": "课程名", "G": "上课教师", "I": "已排时间地点"}),
            (2, {"B": "本科课程", "G": "张三", "I": "1周 星期三 1-2节 前卫-逸夫楼-101"}),
        ])
        first = graduate_cell(
            ("城市经济学 [城市经济学01]", "侯力/前卫校区前卫-逸夫楼-研讨室19", "1-14周"),
            ("教育经济学 [教育经济学01]", "孙伟忠/前卫校区★逸夫楼-101", "2-5周"),
            ("社会服务 [社会服务01]", "李晓玲/前卫校区★逸夫楼-909", "1周"),
            ("讲座 [讲座]", "林晶/前卫校区", "1,12周"),
            ("考察 [考察01]", "王五/前卫校区前卫-逸夫楼-研讨室19", "19周"),
            ("待定课程 [待定课程01]", "赵六/前卫校区前卫-逸夫楼-研讨室19", "未安排周次"),
        )
        second = graduate_cell(
            ("城市经济学 [城市经济学01]", "侯力/前卫校区前卫-逸夫楼-研讨室19", "1-14周"),
            ("城市经济学 [城市经济学01]", "侯力/前卫校区前卫-逸夫楼-研讨室19", "15周"),
        )
        graduate = read([
            (1, {"A": "节次/星期", "B": "时间", "C": "星期一", "D": "星期三"}),
            (2, {"A": "第一节", "B": "08:00~08:45", "C": "", "D": first}),
            (3, {"A": "第二节", "B": "08:55~09:40", "C": "", "D": second}),
        ])
        self.assertEqual(graduate["kind"], "graduate")
        self.assertEqual(graduate["counts"]["weeksBeyondSemester"], 1)
        self.assertEqual(graduate["counts"]["unscheduledEntries"], 1)
        occupancy, catalog, report = importer.build([undergraduate, graduate], SEMESTER)
        courses = {course[1]: course for course in catalog["courses"]}
        self.assertNotIn("考察", courses)
        self.assertEqual(courses["待定课程"][4], [])
        self.assertEqual(courses["城市经济学"][0:4], ["", "城市经济学", "01", "侯力"])
        # Week 15 meets only in the second period, so it stays a separate meeting.
        self.assertEqual([(day, periods, weeks_of(weeks)) for day, periods, weeks, _ in courses["城市经济学"][4]],
                         [(3, 2, [15]), (3, 3, list(range(1, 15)))])
        self.assertEqual(catalog["locations"][courses["教育经济学"][4][0][3]], "前卫校区 逸夫楼-101")
        rooms = [room[:3] for room in occupancy["rooms"]]
        self.assertEqual(rooms, [["前卫", "逸夫楼", "101"], ["前卫", "逸夫楼", "研讨室19"]])
        room_weeks = {}
        for room, _day, _periods, weeks in occupancy["slots"]:
            room_weeks[room] = room_weeks.get(room, 0) | weeks
        self.assertEqual(weeks_of(room_weeks[0]), [1, 2, 3, 4, 5])
        issues = {(issue["source"], issue["reason"], issue["location"]): issue["examples"] for issue in report["issues"]}
        self.assertEqual(issues, {
            ("graduate", "unmappedLocation", "前卫校区 逸夫楼-909"): ["星期三第1节"],
            ("graduate", "missingLocation", "前卫校区"): ["星期三第1节"],
        })
        self.assertEqual(occupancy["source"]["label"], "本科生：fixture.xlsx；研究生：fixture.xlsx")

    def test_graduate_cells_that_cannot_be_split_fail_the_import(self):
        for cell in [
            "城市经济学 [城市经济学01] \t\t侯力/前卫校区前卫-逸夫楼-101\t \t\t",
            graduate_cell(("城市经济学", "侯力/前卫校区前卫-逸夫楼-101", "1-14周")),
            graduate_cell(("城市经济学 [城市经济学01]", "侯力/前卫校区前卫-逸夫楼-101", "第三周")),
        ]:
            with self.subTest(cell=cell), self.assertRaisesRegex(ValueError, "星期一第1节"):
                read([(1, {"A": "节次/星期", "C": "星期一"}), (2, {"A": "第一节", "C": cell})])
        with self.assertRaisesRegex(ValueError, "无法识别节次"):
            read([(1, {"A": "节次/星期", "C": "星期一"}), (2, {"A": "午休", "C": "x"})])

    def test_graduate_weeks_parity_and_weeks_after_the_term(self):
        self.assertEqual(weeks_of(importer.graduate_weeks("1,3-15双周,16周", 18)[0]), [1, 4, 6, 8, 10, 12, 14, 16])
        self.assertEqual(weeks_of(importer.graduate_weeks("1-5单周,7-8周", 18)[0]), [1, 3, 5, 7, 8])
        mask, beyond = importer.graduate_weeks("17-19周", 18)
        self.assertEqual((weeks_of(mask), beyond), ([17, 18], True))
        self.assertEqual(importer.graduate_weeks("未安排周次", 18), (None, False))
        for invalid in ["0周", "8-3周", "3-3双周", "第三周", "3-5"]:
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                importer.graduate_weeks(invalid, 18)

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
        self.assertEqual(importer.parse_location("新民-第一教学楼-206（研究生英语）", {}), ("新民", "第一教学楼", "206"))
        self.assertEqual(importer.parse_location("和平-科学讲堂-科学讲堂100教室", {}), ("和平", "科学讲堂", "100教室"))
        self.assertIsNone(importer.parse_location("401实验室", {}))
        self.assertIsNone(importer.parse_location("线上教学-前卫", {}))

    def test_old_building_names_and_doubled_places_merge_into_one_building(self):
        aliases = {"前卫": {"敬信": "敬信教学楼", "经信": "敬信教学楼", "经信教学楼": "敬信教学楼"}}
        semester = {**SEMESTER, "buildingAliases": aliases}
        part = read([
            (1, {"B": "课程名", "G": "上课教师", "I": "已排时间地点"}),
            (2, {"B": "甲", "G": "张三", "I": "1周 星期一 1-2节 前卫-经信教学楼-F区第四阶梯"}),
            (3, {"B": "乙", "G": "李四", "I": "2周 星期一 1-2节 前卫-敬信教学楼-F区第四阶梯"}),
            (4, {"B": "丙", "G": "王五", "I": "3周 星期一 1-2节 前卫-敬信教学楼 前卫-敬信教学楼-A103"}),
        ], semester)
        occupancy, catalog, _report = importer.build([part], semester)
        self.assertEqual([room[:3] for room in occupancy["rooms"]],
                         [["前卫", "敬信教学楼", "A103"], ["前卫", "敬信教学楼", "F区第四阶梯"]])
        self.assertEqual(catalog["locations"], ["前卫-敬信教学楼-F区第四阶梯", "前卫-敬信教学楼-A103"])
        self.assertIsNone(importer.parse_location("新民校区 新民-通汇大厦1601", {}))
        for location, shown in [
            ("前卫校区 经信419", "前卫校区 敬信教学楼419"),
            ("前卫校区 敬信教学楼-E区107", "前卫校区 敬信教学楼-E区107"),
            ("前卫-李四光楼 前卫-李四光楼-114（医学优先）", "前卫-李四光楼-114（医学优先）"),
            ("线上教学-前卫", "线上教学-前卫"),
        ]:
            with self.subTest(location=location):
                self.assertEqual(importer.display_location(location, aliases), shown)

    def test_free_text_rooms_need_an_unambiguous_building_and_known_room(self):
        match = importer.room_matcher({
            ("前卫", "萃文楼", "232"), ("前卫", "东荣大厦", "A209"), ("和平", "科学讲堂", "601教室"),
            ("新民", "第一教学楼", "101"), ("新民", "第一楼", "101"),
        }, {"前卫": {"东荣": "东荣大厦"}})
        self.assertEqual(match("前卫校区 萃文232"), ("前卫", "萃文楼", "232"))
        self.assertEqual(match("前卫校区 东荣A209室"), ("前卫", "东荣大厦", "A209"))
        self.assertEqual(match("和平校区 科学讲堂601"), ("和平", "科学讲堂", "601教室"))
        self.assertEqual(match("新民校区 第一教学楼101"), ("新民", "第一教学楼", "101"))
        for location in ["前卫校区 萃文207", "前卫校区 514", "前卫校区", "前卫-萃文楼-232", "新民校区 第一101"]:
            with self.subTest(location=location):
                self.assertIsNone(match(location))

    def test_missing_location_is_explicit_and_unrecognized_time_fails(self):
        entries = importer.parse_schedules("1-2周 星期一 第1节-第4节,3周 星期二 1-2节 前卫-逸夫楼-101", 18)
        self.assertEqual(entries[0]["location"], "")
        with self.assertRaises(ValueError):
            importer.parse_schedules("3周 不明时间 前卫-逸夫楼-101", 18)


if __name__ == "__main__":
    unittest.main()
