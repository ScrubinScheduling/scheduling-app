export function createApiClient({ baseUrl, getToken }) {
	async function parseJson(res) {
		const text = await res.text();
		return text ? JSON.parse(text) : null;
	}

	function buildUrl(path, params) {
		const url = new URL(path, baseUrl);
		if (params) {
			for (const [k, v] of Object.entries(params)) {
				if (v === undefined || v === null) continue;
				if (Array.isArray(v)) v.forEach((val) => url.searchParams.append(k, String(val)));
				else url.searchParams.set(k, String(v));
			}
		}
		return url.toString();
	}

	async function request({
		method,
		path,
		body,
		params
	}: {
		method: string;
		path: string;
		body?: any;
		params?: any;
	}) {
		const token = await getToken();
		const headers: Record<string, string> = {
			Accept: 'application/json',
			Authorization: `Bearer ${token}`
		};
		if (body !== undefined) headers['Content-Type'] = 'application/json';

		const res = await fetch(buildUrl(path, params), {
			method,
			headers,
			body: body !== undefined ? JSON.stringify(body) : undefined
		});
		if (!res.ok) {
			const text = await res.text().catch(() => '');
			const err = new Error(text || res.statusText) as Error & { status: number };
			err.status = res.status;
			throw err;
		}
		return await parseJson(res);
	}

	return {
		// Shifts
		getWorkspaceShifts: (workspaceId, params?) =>
			request({ method: 'GET', path: `/workspaces/${workspaceId}/shifts`, params }),
		getShift: (workspaceId, id) =>
			request({ method: 'GET', path: `/workspaces/${workspaceId}/shifts/${id}` }),
		createShift: (workspaceId, data) =>
			request({ method: 'POST', path: `/workspaces/${workspaceId}/shifts`, body: data }),
		updateShift: (workspaceId, id, data) =>
			request({ method: 'PATCH', path: `/workspaces/${workspaceId}/shifts/${id}`, body: data }),
		deleteShift: (workspaceId, id) =>
			request({ method: 'DELETE', path: `/workspaces/${workspaceId}/shifts/${id}` }),
		getUserShifts: (workspaceId, userId, params?) =>
			request({
				method: 'GET',
				path: `/workspaces/${workspaceId}/users/${userId}/shifts`,
				params
			}),
		clockIn: (workspaceId, id, at) =>
			request({
				method: 'POST',
				path: `/workspaces/${workspaceId}/shifts/${id}/clock-in`,
				body: { at }
			}),
		clockOut: (workspaceId, id, at) =>
			request({
				method: 'POST',
				path: `/workspaces/${workspaceId}/shifts/${id}/clock-out`,
				body: { at }
			}),
		startBreak: (workspaceId, id, at) =>
			request({
				method: 'POST',
				path: `/workspaces/${workspaceId}/shifts/${id}/break/start`,
				body: { at }
			}),
		endBreak: (workspaceId, id, at) =>
			request({
				method: 'POST',
				path: `/workspaces/${workspaceId}/shifts/${id}/break/end`,
				body: { at }
			}),

		// Invitations 
		getInvitations: (params?) =>
			request({ method: 'GET', path: '/invitations', params }),
		getInvitation: (id) =>
			request({ method: 'GET', path: `/invitations/${id}` }),
		createInvitation: (data) =>
			request({ method: 'POST', path: '/invitations', body: data }),
		deleteInvitation: (id) =>
			request({ method: 'DELETE', path: `/invitations/${id}` }),
		acceptInvitation: (id) =>
			request({
				method: 'POST',
				path: `/invitations/${id}/accept`,
				body: {}
			}),

		// Users, global
		getUsers: (params?) => request({ method: 'GET', path: '/users', params }),
		getUser: (id) => request({ method: 'GET', path: `/users/${id}` }),
		createUser: (data) => request({ method: 'POST', path: '/users', body: data }),
		updateUser: (id, data) => request({ method: 'PATCH', path: `/users/${id}`, body: data }),
		deleteUser: (id) => request({ method: 'DELETE', path: `/users/${id}` }),

		// Workspaces, global
		getWorkspaces: (params?) => request({ method: 'GET', path: '/workspaces', params }),
		getWorkspace: (id) => request({ method: 'GET', path: `/workspaces/${id}` }),
		createWorkspace: (data) => request({ method: 'POST', path: '/workspaces', body: data }),
		updateWorkspace: (id, data) =>
			request({ method: 'PATCH', path: `/workspaces/${id}`, body: data }),
		deleteWorkspace: (id) => request({ method: 'DELETE', path: `/workspaces/${id}` }),

		// Workspace members
		getWorkspaceMembers: (workspaceId, params?) =>
			request({ method: 'GET', path: `/workspaces/${workspaceId}/users`, params }),
		addMemberToWorkspace: (workspaceId, userId) =>
			request({ method: 'POST', path: `/workspaces/${workspaceId}/users`, body: { userId } }),
		removeMemberFromWorkspace: (workspaceId, userId) =>
			request({ method: 'DELETE', path: `/workspaces/${workspaceId}/users/${userId}` }),

		// Workspace memberships
		getMembershipsByWorkspace: (workspaceId, params?) =>
			request({ method: 'GET', path: `/workspaces/${workspaceId}/memberships`, params }),
		getMembership: (workspaceId, id) =>
			request({ method: 'GET', path: `/workspaces/${workspaceId}/memberships/${id}` }),
		createMembership: (workspaceId, data) =>
			request({ method: 'POST', path: `/workspaces/${workspaceId}/memberships`, body: data }),
		deleteMembership: (workspaceId, id) =>
			request({ method: 'DELETE', path: `/workspaces/${workspaceId}/memberships/${id}` }),
		getMembershipsByUser: (workspaceId, userId, params?) =>
			request({
				method: 'GET',
				path: `/workspaces/${workspaceId}/users/${userId}/memberships`,
				params
			}),

		// Roles
		getRoles: (workspaceId, params?) =>
			request({ method: 'GET', path: `/workspaces/${workspaceId}/roles`, params }),
		getRole: (workspaceId, id) =>
			request({ method: 'GET', path: `/workspaces/${workspaceId}/roles/${id}` }),
		createRole: (workspaceId, data) =>
			request({ method: 'POST', path: `/workspaces/${workspaceId}/roles`, body: data }),
		updateRole: (workspaceId, id, data) =>
			request({ method: 'PATCH', path: `/workspaces/${workspaceId}/roles/${id}`, body: data }),
		deleteRole: (workspaceId, id) =>
			request({ method: 'DELETE', path: `/workspaces/${workspaceId}/roles/${id}` }),
		getRolesByWorkspace: (workspaceId, params?) =>
			request({ method: 'GET', path: `/workspaces/${workspaceId}/roles`, params }),
		getRoleMembers: (workspaceId, roleId, params?) =>
			request({
				method: 'GET',
				path: `/workspaces/${workspaceId}/roles/${roleId}/members`,
				params
			}),
		assignUserToRole: (workspaceId, roleId, userId) =>
			request({
				method: 'PUT',
				path: `/workspaces/${workspaceId}/roles/${roleId}/members/${userId}`
			}),
		revokeUserFromRole: (workspaceId, roleId, userId) =>
			request({
				method: 'DELETE',
				path: `/workspaces/${workspaceId}/roles/${roleId}/members/${userId}`
			}),

		// Role memberships
		getRoleMembershipsByWorkspace: (workspaceId, params?) =>
			request({ method: 'GET', path: `/workspaces/${workspaceId}/role-memberships`, params }),
		getRoleMembership: (workspaceId, id) =>
			request({ method: 'GET', path: `/workspaces/${workspaceId}/role-memberships/${id}` }),
		createRoleMembership: (workspaceId, data) =>
			request({
				method: 'POST',
				path: `/workspaces/${workspaceId}/role-memberships`,
				body: data // { roleId, userId }
			}),
		deleteRoleMembership: (workspaceId, id) =>
			request({ method: 'DELETE', path: `/workspaces/${workspaceId}/role-memberships/${id}` }),
		getRoleMembershipsByUser: (workspaceId, userId, params?) =>
			request({
				method: 'GET',
				path: `/workspaces/${workspaceId}/users/${userId}/role-memberships`,
				params
			}),

		// Permissions, global
		getPermissions: () => request({ method: 'GET', path: `/permissions` }),
		getPermission: (bitkey) => request({ method: 'GET', path: `/permissions/${bitkey}` }),

		// Shift requests
		getShiftRequestsByWorkspace: (workspaceId, params?) =>
			request({ method: 'GET', path: `/workspaces/${workspaceId}/shift-requests`, params }),
		getShiftRequest: (workspaceId, id) =>
			request({ method: 'GET', path: `/workspaces/${workspaceId}/shift-requests/${id}` }),
		createShiftRequest: (workspaceId, data) =>
			request({ method: 'POST', path: `/workspaces/${workspaceId}/shift-requests`, body: data }),
		updateShiftRequest: (workspaceId, id, data) =>
			request({
				method: 'PATCH',
				path: `/workspaces/${workspaceId}/shift-requests/${id}`,
				body: data
			}),
		deleteShiftRequest: (workspaceId, id) =>
			request({ method: 'DELETE', path: `/workspaces/${workspaceId}/shift-requests/${id}` }),
		getShiftRequestsByUser: (workspaceId, userId, params?) =>
			request({
				method: 'GET',
				path: `/workspaces/${workspaceId}/users/${userId}/shift-requests`,
				params
			}),
		approveShiftRequest: (workspaceId, id) =>
			request({
				method: 'POST',
				path: `/workspaces/${workspaceId}/shift-requests/${id}/approve`,
				body: {}
			}),
		rejectShiftRequest: (workspaceId, id) =>
			request({
				method: 'POST',
				path: `/workspaces/${workspaceId}/shift-requests/${id}/reject`,
				body: {}
			}),

		// Meetings
		getMeetingsByWorkspace: (workspaceId, params?) =>
			request({ method: 'GET', path: `/workspaces/${workspaceId}/meetings`, params }),
		getMeeting: (workspaceId, id) =>
			request({ method: 'GET', path: `/workspaces/${workspaceId}/meetings/${id}` }),
		createMeeting: (workspaceId, data) =>
			request({ method: 'POST', path: `/workspaces/${workspaceId}/meetings`, body: data }),
		deleteMeeting: (workspaceId, id) =>
			request({ method: 'DELETE', path: `/workspaces/${workspaceId}/meetings/${id}` })
	};
}
