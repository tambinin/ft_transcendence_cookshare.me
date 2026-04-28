import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { FiFlag } from 'react-icons/fi';
import reportService from '../../services/report.service';
import { REPORT_REASONS } from '../../constants/report.const';
import type { ReportReason, ReportTargetType } from '../../types/report.type';

export interface ReportModalHandle {
	open: (targetType: ReportTargetType, targetId: string) => void;
}

const ReportModal = forwardRef<ReportModalHandle>((_props, ref) => {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [targetType, setTargetType] = useState<ReportTargetType>('RECIPE');
	const [targetId, setTargetId] = useState('');
	const [reason, setReason] = useState<ReportReason | ''>('');
	const [description, setDescription] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<'success' | 'conflict' | 'error' | null>(null);

	useImperativeHandle(ref, () => ({
		open: (type: ReportTargetType, id: string) => {
			setTargetType(type);
			setTargetId(id);
			setReason('');
			setDescription('');
			setResult(null);
			dialogRef.current?.showModal();
		},
	}));

	const handleSubmit = async () => {
		if (!reason || submitting) return;
		setSubmitting(true);
		setResult(null);
		try {
			const data = { reason, description: description.trim() || undefined };
			if (targetType === 'RECIPE') {
				await reportService.reportRecipe(targetId, data);
			} else {
				await reportService.reportComment(targetId, data);
			}
			setResult('success');
			setTimeout(() => dialogRef.current?.close(), 1500);
		} catch (err: any) {
			setResult(err?.response?.status === 409 ? 'conflict' : 'error');
		} finally {
			setSubmitting(false);
		}
	};

	const close = () => dialogRef.current?.close();

	return (
		<dialog ref={dialogRef} className="modal backdrop-blur-sm">
			<div className="modal-box rounded-2xl max-w-md">
				<div className="flex items-center gap-2 mb-4">
					<FiFlag className="text-orange-400" size={20} />
					<h2 className="text-lg font-bold">
						Report {targetType === 'RECIPE' ? 'Recipe' : 'Comment'}
					</h2>
				</div>

				{result === 'success' ? (
					<p className="text-green-400 text-sm text-center py-6">
						Report submitted. Thank you.
					</p>
				) : result === 'conflict' ? (
					<>
						<p className="text-orange-400 text-sm text-center py-6">
							You have already reported this content.
						</p>
						<button onClick={close} className="w-full px-4 py-3 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white">
							Close
						</button>
					</>
				) : (
					<>
						<p className="text-sm text-white/40 mb-4">Why are you reporting this?</p>

						<div className="space-y-2 mb-4">
							{REPORT_REASONS.map(r => (
								<label
									key={r.value}
									className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
										reason === r.value
											? 'border-orange-400/50 bg-orange-500/10'
											: 'border-white/5 bg-white/[0.04] hover:bg-white/[0.06]'
									}`}
								>
									<input
										type="radio"
										name="report-reason"
										value={r.value}
										checked={reason === r.value}
										onChange={() => setReason(r.value as ReportReason)}
										className="accent-orange-500"
									/>
									<span className="text-sm text-white/80">{r.label}</span>
								</label>
							))}
						</div>

						<textarea
							value={description}
							onChange={e => setDescription(e.target.value)}
							placeholder="Additional details (optional)..."
							maxLength={1000}
							rows={3}
							className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-orange-400/50 transition-colors resize-none mb-4"
						/>

						{result === 'error' && (
							<p className="text-red-400 text-xs mb-3">Something went wrong. Please try again.</p>
						)}

						<div className="flex gap-3">
							<button
								onClick={close}
								className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white"
							>
								Cancel
							</button>
							<button
								onClick={handleSubmit}
								disabled={!reason || submitting}
								className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 disabled:opacity-30 transition-all text-white"
							>
								{submitting ? 'Sending...' : 'Report'}
							</button>
						</div>
					</>
				)}
			</div>
			<form method="dialog" className="modal-backdrop">
				<button>close</button>
			</form>
		</dialog>
	);
});

ReportModal.displayName = 'ReportModal';
export default ReportModal;
