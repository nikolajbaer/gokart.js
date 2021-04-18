import React from "react";
import { Vector2 } from "three";

// percent of distance from center of pad before we 
// become "active", e.g. to shoot
const ACTIVATION_LEVEL = 0.6

export class MobileStick extends React.Component {
    constructor(props){
        super(props)
        this.canvasRef = React.createRef()
        this.state = {
            x: 0,
            y: 0,
            active: false,
            touch_id: null,
        }

        this.handleTouchStart = this.handleTouchStart.bind(this)
        this.handleTouchMove = this.handleTouchMove.bind(this)
        this.handleTouchEnd = this.handleTouchEnd.bind(this)
    }

    componentDidMount(){
        this.drawCanvas(null,false)
    }

    // TODO make sure this touch is new for this one?
    handleTouchStart(event){
        if(this.state.touch_id == null){
            this.updateVector(event.changedTouches[0])
        }
    }

    handleTouchMove(event){
        if(this.state.touch_id != null && event.touches[this.state.touch_id]){
            this.updateVector(event.touches[this.state.touch_id])
        }

    }

    // CONSIDER do i need to handle window touch end?
    handleTouchEnd(event){
        // for some reason changedTouches is a mapping by arbitrary index
        // so we have to iterate through it
        for(var i=0; i<event.changedTouches.length; i++){
            const t = event.changedTouches.item(i)
            if(t.identifier == this.state.touch_id){
                this.setState({ touch_id: null,x: 0,y: 0,active:false})
                this.sendEvent(0,0,false)
                this.drawCanvas(null,false)
                break
            }
        }
    }

    updateVector(touch){
        const client_bounding_rect =  this.canvasRef.current.getBoundingClientRect()

        // location relative to client top left
        const p = new Vector2(
            touch.clientX - client_bounding_rect.left,
            touch.clientY - client_bounding_rect.top,
        ) 

        const w = this.canvasRef.current.width
        const h = this.canvasRef.current.height
        const max_rad = w/2 - this.props.pad_radius
      
        // position from center of pad
        const center = new Vector2(w/2,h/2)
        // direction from center
        const rp = p.sub(center)

        // cap distance of pad to our max_rad
        let active = rp.length() >= max_rad * ACTIVATION_LEVEL
        if( rp.length() >= max_rad ){
            rp.multiplyScalar(max_rad/rp.length())
        }
        const pad_pos = center.add(rp)

        // our directional vector we store and dispatch
        const v = new Vector2(rp.x,-rp.y).normalize()
        this.setState({
            touch_id: touch.identifier,x:v.x,y:v.y,active:active
        })
        this.sendEvent(v.x,v.y,active)
        
        this.drawCanvas(pad_pos,active)
    }

    sendEvent(x,y,active){
        const event = new CustomEvent("joystick-"+this.props.joystickId, { detail: { x:x, y:y, active:active } })
        window.dispatchEvent(event)
    }

    drawCanvas(p,active){
        const ctx = this.canvasRef.current.getContext('2d');
        const w = this.canvasRef.current.width
        const h = this.canvasRef.current.height
        
        ctx.clearRect(0,0,this.props.width,this.props.height)
        ctx.beginPath()
        ctx.arc(
            w/2,h/2,(this.props.width/2 - this.props.pad_radius),
            0,Math.PI*2
        )
        ctx.strokeStyle = "rgba(200,200,200,0.25)"
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(
            (p==null)?w/2:p.x,
            (p==null)?h/2:p.y,
            this.props.pad_radius,
            0,Math.PI * 2)
        if(this.props.activeColor){
            ctx.fillStyle = (active)?this.props.activeColor:"rgba(200,200,200,0.25)"
        }else{
            ctx.fillStyle = "rgba(200,200,200,0.25)"
        }
        ctx.strokeStyle = "#888"
        ctx.fill()
        ctx.stroke()
    }

    render(){
        return (
            <div className="mobilestick" id={this.props.joystickId}>
                <canvas
                    width={this.props.width}
                    height={this.props.height}
                    ref={this.canvasRef}
                    onTouchStart={this.handleTouchStart}
                    onTouchMove={this.handleTouchMove}
                    onTouchEnd={this.handleTouchEnd}
                ></canvas>
            </div>
        )
    }
}
