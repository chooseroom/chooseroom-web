import Breadcrumb from "@/components/Common/Dashboard/Breadcrumb";
import React from "react";
import { Metadata } from "next";
import NotificationsView from "@/components/Common/NotificationsView";

export const metadata: Metadata = {
	title: `Notifications | Choose Ghar Owner`,
	description: `Property, onboarding, and room management notifications`,
};

const NotificationPage = () => {
	return (
		<div className='space-y-6 pb-12'>
			<Breadcrumb pageTitle='Owner Notifications' />
			<NotificationsView role='BUSINESS_OWNER' />
		</div>
	);
};

export default NotificationPage;
