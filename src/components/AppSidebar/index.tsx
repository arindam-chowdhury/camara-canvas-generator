import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ComponentContext } from "@/store/handle-component-context"
import { useContext } from "react"
import AddSpeechRecognitionComponent from "../AddSpeechRecognition";


export function AppSidebar() {

  const { addComponent } = useContext(ComponentContext);
  

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroupLabel>Application</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="cursor-pointer" onClick={() => addComponent("BarChartComponent")} asChild>
                <span>Add Bar Chart Component</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton className="cursor-pointer" onClick={() => addComponent("PieChartComponent")} asChild>
                <span>Add Pie Chart Component</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
              <AddSpeechRecognitionComponent />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}