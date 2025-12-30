"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Copy, Link as LinkIcon } from "lucide-react";

type AddMemberModalProps = {
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
	inviteLink: string;
};

export default function AddMemberModal({ open, setOpen, inviteLink }: AddMemberModalProps) {
	const [copied, setCopied] = useState(false);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(inviteLink);
			setCopied(true);
			setTimeout(() => setCopied(false), 1200);
		} catch {
			setCopied(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-bold">Invite a member</DialogTitle>
					<DialogDescription>Share this link to invite a team member.</DialogDescription>
				</DialogHeader>

				<div className="space-y-2">
					<label htmlFor="invite-link-input" className="text-sm text-muted-foreground">
						Invite link
					</label>

					<div className="flex items-center gap-2">
						<div className="flex items-center gap-2 w-full rounded-md border border-input bg-input/20 px-3 py-2">
							<LinkIcon size={16} className="shrink-0 text-muted-foreground" />
							<input
								id="invite-link-input"
								readOnly
								value={inviteLink}
								tabIndex={-1}
								className="w-full bg-transparent text-sm outline-none"
							/>
						</div>

						<button
							onClick={copyLink}
							className="inline-flex items-center gap-2 rounded-md px-3 py-2 bg-foreground text-background hover:bg-foreground/90"
						>
							<Copy size={16} />
							{copied ? "Copied!" : "Copy"}
						</button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
