"use client"
import { AppSidebar } from "@/components/AppSidebar";
import GridStack from "@/components/GridStack";
import { SidebarProvider } from "@/components/ui/sidebar";
import HandleComponentContextProvider from "@/store/handle-component-context";

const Page = () => {
    return (
        <HandleComponentContextProvider>
        <SidebarProvider>
            <AppSidebar />
            <div className="px-4 flex flex-col">
                <h1 className="text-center text-4xl">Application</h1>
                <GridStack />
            </div>
        </SidebarProvider>
    </HandleComponentContextProvider>
    );
}
export default Page;