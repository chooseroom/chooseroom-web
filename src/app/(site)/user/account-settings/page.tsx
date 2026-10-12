import Breadcrumb from "@/components/Common/Dashboard/Breadcrumb";
import AccountSettings from "@/components/User/AccountSettings";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
	title: `Account Settings - ${process.env.SITE_NAME || "Choose Ghar"}`,
	description:
		"Manage your PG/Hostel owner profile, password, and security settings.",
};

export default async function AccountSettingsPage() {
	const t = await getTranslations("account_settings_page");

	return (
		<div className='space-y-6'>
			<Breadcrumb pageTitle={t("heading") || "Account Settings"} />
			<AccountSettings />
		</div>
	);
}
