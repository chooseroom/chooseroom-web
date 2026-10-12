import { redirect } from "next/navigation";

export default function ManageUsersRedirect() {
	redirect("/admin/owners");
}
