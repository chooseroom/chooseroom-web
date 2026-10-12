import Breadcrumb from "@/components/Common/Dashboard/Breadcrumb";
import React from "react";
import { Metadata } from "next";
import NotificationsView from "@/components/Common/NotificationsView";

export const metadata: Metadata = {
	title: `Notifications | Choose Ghar Admin`,
	description: `System, owner registration and PG/Hostel property notifications`,
};

const NotificationPage = () => {
	return (
		<div className='space-y-6 pb-12'>
			<Breadcrumb pageTitle='Admin Notifications' />
			<NotificationsView role='ADMIN' />
		</div>
	);
};

export default NotificationPage;
