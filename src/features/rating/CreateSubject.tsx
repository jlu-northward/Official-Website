import { useRef, useState } from "react";
import { request } from "./api";
import {
	cleanTags,
	navigateBack,
	typeTags,
	type Rank,
	type Upload,
} from "./types";
import { ErrorMessage, ImagesInput, PageHeader } from "./ui";

export function CreateSubject({
	ranks,
	campuses,
	initialRankId,
}: {
	ranks: Rank[];
	campuses: string[];
	initialRankId?: number;
}) {
	const available = ranks.filter((rank) => rank.status === 1);
	const [rankId, setRankId] = useState(
		available.some((rank) => rank.id === initialRankId)
			? String(initialRankId)
			: "",
	);
	const rank = available.find((item) => String(item.id) === rankId);
	const kind = rank?.subjectType || "general";
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [images, setImages] = useState<Upload[]>([]);
	const [campus, setCampus] = useState("");
	const [building, setBuilding] = useState("");
	const [address, setAddress] = useState("");
	const [latitude, setLatitude] = useState("");
	const [longitude, setLongitude] = useState("");
	const [tags, setTags] = useState("");
	const [months, setMonths] = useState<number[]>([]);
	const [products, setProducts] = useState<{ name: string; price: string }[]>(
		[],
	);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [success, setSuccess] = useState(false);
	const submitting = useRef(false);
	async function submit(event: React.FormEvent) {
		event.preventDefault();
		if (submitting.current || uploading) return;
		if (!rank || !title.trim() || !description.trim() || !images.length) {
			setError("请选择榜单，填写名称、简介并上传封面");
			return;
		}
		const locationEnabled = kind !== "general";
		if (
			locationEnabled &&
			(building.trim() || address.trim() || latitude || longitude) &&
			campus === ""
		) {
			setError("填写位置时请先选择校区");
			return;
		}
		if (locationEnabled && Boolean(latitude) !== Boolean(longitude)) {
			setError("经度和纬度请一起填写，或都留空");
			return;
		}
		const tagValues = cleanTags(tags);
		if (tagValues.length > 8 || tagValues.some((value) => value.length > 30)) {
			setError("最多填写 8 个标签，每个不超过 30 字");
			return;
		}
		if (kind === "food" && products.some((product) => !product.name.trim())) {
			setError("请填写每个招牌单品的名称");
			return;
		}
		submitting.current = true;
		setBusy(true);
		setError("");
		try {
			await request(
				"rate/subject/create",
				{
					rankListId: rank.id,
					title: title.trim(),
					description: description.trim(),
					coverUrl: images[0].objectKey,
					tags: tagValues,
					...(locationEnabled
						? {
								...(campus !== "" ? { campusCode: Number(campus) } : {}),
								building: building.trim(),
								address: address.trim(),
								...(latitude && longitude
									? { latitude: Number(latitude), longitude: Number(longitude) }
									: {}),
							}
						: {}),
					...(kind === "photography" ? { recommendedMonths: months } : {}),
					...(kind === "food"
						? {
								products: products.map((item) => ({
									name: item.name.trim(),
									price: item.price === "" ? null : Number(item.price),
								})),
							}
						: {}),
				},
				"POST",
			);
			setSuccess(true);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			submitting.current = false;
			setBusy(false);
		}
	}
	const back = rankId ? `/ranks/${rankId}` : "/";
	if (success)
		return (
			<>
				<PageHeader title="提交成功" back={back} />
				<div className="rate-success">
					<span>✓</span>
					<h1>已提交，等待审核</h1>
					<p>审核通过后，其他同学就能看到并参与评分。</p>
					<button className="rate-primary" onClick={() => navigateBack(back)}>
						返回榜单
					</button>
				</div>
			</>
		);
	return (
		<>
			<PageHeader title="新增评分对象" back={back} />
			<form className="rate-create" onSubmit={submit}>
				<fieldset disabled={busy || uploading}>
					<section className="rate-form-card">
						<label>
							选择榜单
							<select
								required
								value={rankId}
								onChange={(event) => setRankId(event.target.value)}
							>
								<option value="">请选择榜单</option>
								{available.map((rank) => (
									<option key={rank.id} value={rank.id}>
										{rank.title}
									</option>
								))}
							</select>
						</label>
					</section>
					<section className="rate-form-card">
						<label>
							对象名称
							<input
								required
								maxLength={20}
								value={title}
								onChange={(event) => setTitle(event.target.value)}
								placeholder="请输入名称（20字以内）"
							/>
						</label>
					</section>
					<section className="rate-form-card">
						<label>
							简介
							<textarea
								required
								maxLength={500}
								rows={4}
								value={description}
								onChange={(event) => setDescription(event.target.value)}
								placeholder="介绍一下这个评分对象，让其他人更好地了解它"
							/>
						</label>
						<span className="rate-counter">{description.length}/500</span>
					</section>
					<section className="rate-form-card">
						<h2>上传封面图</h2>
						<ImagesInput
							images={images}
							onChange={setImages}
							max={1}
							disabled={busy}
							onBusy={setUploading}
						/>
					</section>
					{rank && kind !== "general" && (
						<section className="rate-form-card">
							<h2>
								位置 <small>选填</small>
							</h2>
							<div className="rate-fields">
								<label>
									校区
									<select
										value={campus}
										onChange={(event) => {
											setCampus(event.target.value);
											setBuilding("");
										}}
									>
										<option value="">暂不填写</option>
										{campuses.map((name, code) => (
											<option key={code} value={code}>
												{name}
											</option>
										))}
									</select>
								</label>
								<label>
									楼栋或地点
									<input
										maxLength={60}
										value={building}
										onChange={(event) => setBuilding(event.target.value)}
										placeholder="如：日新楼、逸夫教学楼"
									/>
								</label>
							</div>
							<label>
								详细地址
								<input
									maxLength={200}
									value={address}
									onChange={(event) => setAddress(event.target.value)}
									placeholder="如楼层、窗口或场馆位置"
								/>
							</label>
							<details>
								<summary>补充地图坐标（选填）</summary>
								<p className="rate-muted rate-small">
									填写高德地图坐标，可直接定位；不填也可按地址搜索。
								</p>
								<div className="rate-fields">
									<label>
										纬度
										<input
											type="number"
											min="-90"
											max="90"
											step="0.000001"
											value={latitude}
											onChange={(event) => setLatitude(event.target.value)}
										/>
									</label>
									<label>
										经度
										<input
											type="number"
											min="-180"
											max="180"
											step="0.000001"
											value={longitude}
											onChange={(event) => setLongitude(event.target.value)}
										/>
									</label>
								</div>
							</details>
						</section>
					)}
					{kind === "photography" && (
						<section className="rate-form-card">
							<h2>
								推荐拍摄月份 <small>选填</small>
							</h2>
							<div className="rate-chips">
								{Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
									<button
										type="button"
										key={month}
										className={`rate-chip ${months.includes(month) ? "selected" : ""}`}
										aria-pressed={months.includes(month)}
										onClick={() =>
											setMonths((current) =>
												current.includes(month)
													? current.filter((value) => value !== month)
													: [...current, month].sort((a, b) => a - b),
											)
										}
									>
										{month}月
									</button>
								))}
							</div>
						</section>
					)}
					<section className="rate-form-card">
						<label>
							类型标签 <small>选填</small>
							<input
								value={tags}
								onChange={(event) => setTags(event.target.value)}
								maxLength={247}
								placeholder="用逗号分隔，如：室内，羽毛球"
							/>
						</label>
						{typeTags[kind] && (
							<div className="rate-chips">
								{typeTags[kind]?.map((tag) => (
									<button
										type="button"
										className="rate-chip"
										key={tag}
										onClick={() =>
											setTags(cleanTags(`${tags},${tag}`).join("，"))
										}
									>
										{tag} +
									</button>
								))}
							</div>
						)}
						<p className="rate-muted rate-small">
							最多 8 个标签，方便同学按类型寻找。
						</p>
					</section>
					{kind === "food" && (
						<section className="rate-form-card">
							<h2>
								招牌单品 <small>选填</small>
							</h2>
							{products.map((product, index) => (
								<div key={index} className="rate-product-fields">
									<label>
										单品名称
										<input
											required
											maxLength={60}
											value={product.name}
											onChange={(event) =>
												setProducts((items) =>
													items.map((item, i) =>
														i === index
															? { ...item, name: event.target.value }
															: item,
													),
												)
											}
										/>
									</label>
									<label>
										参考价格（元）
										<input
											type="number"
											min="0"
											max="99999.99"
											step="0.01"
											value={product.price}
											placeholder="可留空"
											onChange={(event) =>
												setProducts((items) =>
													items.map((item, i) =>
														i === index
															? { ...item, price: event.target.value }
															: item,
													),
												)
											}
										/>
									</label>
									<button
										type="button"
										className="rate-danger"
										aria-label={`删除单品 ${index + 1}`}
										onClick={() =>
											setProducts((items) =>
												items.filter((_, i) => i !== index),
											)
										}
									>
										删除
									</button>
								</div>
							))}
							{products.length < 20 && (
								<button
									type="button"
									className="rate-chip"
									onClick={() =>
										setProducts((items) => [...items, { name: "", price: "" }])
									}
								>
									＋ 添加单品
								</button>
							)}
						</section>
					)}
				</fieldset>
				{error && <ErrorMessage error={error} />}
				<button
					type="submit"
					className="rate-primary"
					disabled={busy || uploading}
				>
					{busy ? "提交中…" : uploading ? "图片上传中…" : "提交审核"}
				</button>
			</form>
		</>
	);
}
