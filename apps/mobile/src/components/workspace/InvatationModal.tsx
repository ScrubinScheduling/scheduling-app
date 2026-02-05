import { View, Text } from 'react-native';
import React from 'react';

type ModalProps = {
	workspaceName: string;
	workspaceOwnerEmail: string;
	workspaceOwnerName: string;
	invitationId: string;
};

export default function InvatationModal({
	workspaceName,
	workspaceOwnerEmail,
	workspaceOwnerName,
	invitationId
}: ModalProps) {
	return (
		<View>
			<Text>InvatationModal</Text>
		</View>
	);
}
