import { createContext, ReactNode, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

type componentItem = {
    _id: string,
    componentName: string,
}

export const ComponentContext = createContext<{
    componentList: componentItem[],
    addComponent: (componentType: string) => void,
    deleteComponent: (id: string) => void
}>({
    componentList: [],
    addComponent: () => {},
    deleteComponent: () => {}
});

const initialComponentList:Array<componentItem> = [{_id: uuidv4(), componentName: "BarChartComponent"}];

export default function HandleComponentContextProvider({children}:{children: ReactNode}) {
    const [componentList, setComponentList] = useState(initialComponentList);
    
    const addComponent = (componentType: string) => {
        setComponentList(prev => {
            const item = {
                _id: uuidv4(),
                componentName: componentType
            };
            return [...prev, item];
        });
    }

    const deleteComponent = (id: string) => {
        setComponentList(prev => {
            return prev.filter(item => item._id !== id);
        })
    }

    const ctxValue = {
        componentList,
        addComponent,
        deleteComponent
    }

    return <ComponentContext.Provider value={ctxValue}>{children}</ComponentContext.Provider>
}