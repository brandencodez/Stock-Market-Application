import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";

const Layout = async ({ children }: { children : React.ReactNode }) => {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/sign-in');
    }

    return (
        <main className="min-h-screen text-gray-400">
            <Header user={user} />

            <div className="container py-10">
                {children}
            </div>
        </main>
    )
}

export default Layout