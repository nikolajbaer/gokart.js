import React, { useState } from "react";
import { observer } from "mobx-react-lite"

export const HUDView = observer( ({ hudState }) => {
    const [name, setName ] = useState("")

    if(hudState == null){
        return ""
    }

    return (<div className="hud">
                Score: {hudState.score}
        </div>
    )
})

