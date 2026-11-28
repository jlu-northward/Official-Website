import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { buildCommentBody } from "../src/features/rating/comment-form.ts";
import {
	legacyComment,
	legacyRank,
	legacySubject,
} from "../src/features/rating/preview-legacy.ts";

// 用项目现有的 Vite 编译 TSX，验证真实组件接收旧 DTO 后的输出。
const server = await createServer({
	configFile: false,
	cacheDir: "node_modules/.vite-rating-tests",
	server: { middlewareMode: true, watch: null },
	esbuild: { jsx: "automatic" },
});
after(() => server.close());
const { SubjectRow } = await server.ssrLoadModule(
	"/src/features/rating/ui.tsx",
);
const { CommentCard, Composer } = await server.ssrLoadModule(
	"/src/features/rating/Comments.tsx",
);
const { RankView } = await server.ssrLoadModule(
	"/src/features/rating/RankViews.tsx",
);
const render = (component, props) =>
	renderToStaticMarkup(createElement(component, props));
const callbacks = { onReply() {}, onEdit() {}, onChanged() {} };

const editFields = (comment = legacyComment) => ({
	content: comment.content,
	score: comment.score,
	anonymous: comment.is_anonymous === 1,
	images: (comment.image_url || []).map((url) => ({ objectKey: url, url })),
	editing: comment,
	isReply: false,
});

test("仅改分保留未编辑的历史正文和图片，不重新提交旧外链", () => {
	const original = { ...legacyComment, content: "  旧正文\n保留空白  " };
	const before = structuredClone(original);
	assert.deepEqual(buildCommentBody({ ...editFields(original), score: 9 }), {
		is_anonymous: 1,
		score: 9,
	});
	assert.deepEqual(original, before);
});

test("增删图片才提交附件字段，清空用空数组，保留原图引用", () => {
	const fields = editFields();
	assert.deepEqual(buildCommentBody({ ...fields, images: [] }).image_url, []);
	const newImage = {
		objectKey: "rate/42/new.jpg",
		url: "https://example.com/new.jpg",
	};
	assert.deepEqual(
		buildCommentBody({ ...fields, images: [...fields.images, newImage] })
			.image_url,
		[...legacyComment.image_url, newImage.objectKey],
	);
	assert.equal(
		buildCommentBody({ ...fields, content: " 更新正文 " }).content,
		"更新正文",
	);
});

test("新评价完整提交，编辑回复不混入根评分", () => {
	assert.deepEqual(buildCommentBody({ ...editFields(), editing: undefined }), {
		content: legacyComment.content,
		is_anonymous: 1,
		image_url: legacyComment.image_url,
		score: 7,
	});
	assert.deepEqual(buildCommentBody({ ...editFields(), isReply: true }), {
		is_anonymous: 1,
	});
});

test("旧榜单缺少类型和封面仍可打开，不强制补齐校园信息", () => {
	const html = render(RankView, { rank: legacyRank, campuses: [], query: "" });
	assert.match(html, /校园生活榜/);
	assert.match(html, /添加评分对象/);
	assert.doesNotMatch(html, /校区筛选|拍摄月份|类型筛选/);
});

test("旧对象保留 ID、评分、人数、描述，nullable 元数据不影响渲染", () => {
	for (const metadata of [
		{},
		{ campusCode: null, tags: null, products: null, recommendedMonths: null },
	]) {
		const subject = { ...legacySubject, ...metadata };
		const before = structuredClone(subject);
		const html = render(SubjectRow, { subject, campuses: [], index: 0 });
		assert.match(html, /href="#\/subjects\/60"/);
		assert.match(html, /老食堂/);
		assert.match(html, /以前留下的校园记忆/);
		assert.match(html, /7\.5/);
		assert.match(html, /2人评分/);
		assert.doesNotMatch(html, /NaN|undefined/);
		assert.deepEqual(subject, before);
	}
});

test("旧空分数和空人数按未评分显示，不伪造评分", () => {
	const html = render(SubjectRow, {
		subject: {
			...legacySubject,
			avgScore: null,
			totalCount: null,
			description: null,
		},
		campuses: [],
	});
	assert.match(html, /暂无评分/);
	assert.doesNotMatch(html, /NaN|undefined|null/);
});

test("历史匿名评价保留日期、正文、图片、点赞和编辑入口", () => {
	const before = structuredClone(legacyComment);
	const html = render(CommentCard, { comment: legacyComment, ...callbacks });
	assert.match(html, /匿名同学/);
	assert.match(html, /旧评价第一行\n第二行也要保留/);
	assert.match(html, /2025-06-01 12:30/);
	assert.match(html, /legacy-photo\.jpg/);
	assert.match(html, /aria-label="7分"/);
	assert.match(html, /取消点赞/);
	assert.match(html, />8<\/button>/);
	assert.match(html, />编辑<\/button>/);
	assert.deepEqual(legacyComment, before);
});

test("编辑历史评价初始化保留奇数分、换行、匿名和原图片", () => {
	const html = render(Composer, {
		subjectId: 60,
		target: { editing: legacyComment },
		onClose() {},
		onSaved() {},
	});
	assert.match(html, />7分<\/span>/);
	assert.match(html, /旧评价第一行\n第二行也要保留/);
	assert.match(html, /legacy-photo\.jpg/);
	assert.match(html, /type="checkbox"[^>]*checked/);
	assert.match(html, /保存修改/);
});

test("尊重评分隐私开关，匿名头像不泄露，实名回复不关联匿名评分", () => {
	const hidden = render(CommentCard, {
		comment: {
			...legacyComment,
			show_rate_badge: false,
			authorAvatar: "https://example.com/private-avatar.jpg",
		},
		...callbacks,
	});
	assert.doesNotMatch(hidden, /aria-label="7分"|private-avatar/);
	const reply = render(CommentCard, {
		comment: {
			...legacyComment,
			parentId: 59,
			is_anonymous: 0,
			score: 0,
			user_score: null,
			show_rate_badge: false,
		},
		...callbacks,
	});
	assert.doesNotMatch(reply, /rate-comment-stars/);
});

test("评分标记以 user_score 为准，旧响应缺该字段时保留原 score", () => {
	const renderScore = (fields) =>
		render(CommentCard, {
			comment: { ...legacyComment, ...fields },
			...callbacks,
		});
	assert.match(renderScore({ score: 0, user_score: 9 }), /aria-label="9分"/);
	assert.match(
		renderScore({
			score: 7,
			user_score: undefined,
			show_rate_badge: undefined,
		}),
		/aria-label="7分"/,
	);
	assert.doesNotMatch(
		renderScore({ score: 7, user_score: 0 }),
		/rate-comment-stars/,
	);
});
