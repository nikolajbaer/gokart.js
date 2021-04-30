import React, { useState } from "react";
import { observer } from "mobx-react-lite"

export const HUDView = observer( ({ hudState,children }) => {
    const [name, setName ] = useState("")

    if(hudState == null){
        return ""
    }

    return (
        <div className="hud">
            {children(hudState)}
        </div>
    )
})

