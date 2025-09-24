import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import GridLayout from "react-grid-layout";
import { BarChartComponent } from "../BarChart";
import { PieChartComponent } from "../PieChart";
import { useContext, useEffect,  useState } from "react";
import { ComponentContext } from "@/store/handle-component-context";

type LayoutItem = {
    i: string, // A unique ID for the item
    x: number, // The x-position on the grid
    y: number, // The y-position on the grid
    w: number, // The width of the item
    h: number, // The height of the item
    isDraggable?: boolean,
    isResizable?: boolean,
    static?: boolean,
    minW?: number,
    maxW?: number,
    minH?: number,
    maxH?: number,
};

export default function GridStack() {
    
    const {componentList} = useContext(ComponentContext);
    const [layoutValue, setLayoutValue] = useState<LayoutItem[]>([]);


    useEffect(() => {
        console.log("List hit");

        setLayoutValue(currentLayout => {
            // Filter out any layout items that no longer exist in componentList
            const filteredLayout = currentLayout.filter(layoutItem =>
                componentList.some(comp => comp._id === layoutItem.i)
            );

            // Add new components that aren't in the filtered layout yet
            const newLayoutItems: LayoutItem[] = [];
            componentList.forEach(comp => {
                const isComponentInLayout = filteredLayout.some(layoutItem => layoutItem.i === comp._id);
                if (!isComponentInLayout) {
                    let itemConfig: Omit<LayoutItem, 'i'> = { x: 0, y: Infinity, w: 4, h: 2, minW: 2, minH: 1 };
                    if (comp.componentName === "PieChartComponent") {
                        itemConfig = { ...itemConfig, h: 2, minW: 4, minH: 2 };
                    }
                    if (comp.componentName === "BarChartComponent") {
                        itemConfig = { ...itemConfig, h: 2, minW: 2, minH: 1 };
                    }
                    newLayoutItems.push({
                        i: comp._id,
                        ...itemConfig,
                    });
                }
            });

            return [...filteredLayout, ...newLayoutItems];
        });

    }, [componentList]);

    const onLayoutChange = (newLayout: LayoutItem[]) => {
        setLayoutValue(newLayout);
    };

    
    return (
        <GridLayout
        className="grow layout"
        layout={layoutValue}
        cols={12}
        width={1200}
        onLayoutChange={onLayoutChange}
        draggableCancel=".no-drag"
        >
        {layoutValue.length > 0 ? (
          layoutValue.map((item) => {
            const componentItem = componentList.find((i) => item.i === i._id);

            if (!componentItem) return null;

            switch (componentItem.componentName) {
              case "BarChartComponent": {
                return (
                  <div className="border" key={item.i}>
                    <BarChartComponent id={componentItem._id} />
                  </div>
                );
              }
              case "PieChartComponent": {
                return (
                  <div className="border" key={item.i}>
                    <PieChartComponent id={componentItem._id} />
                  </div>
                );
              }
            }
          })
        ) : (
          <p>No Data</p>
        )}
      </GridLayout>
    );
}