import { System } from "ecsy"
import { Overlay2dComponent } from "../components/overlay2d.js"
import { Project2dComponent } from "../components/render.js"

export class Overlay2dSystem extends System {
    init(attributes){
        this.draw_functions = (attributes && attributes.draw_functions)?attributes.draw_functions:{
            "square": (ctx,x,y,opts) => this.draw_square(ctx,x,y,opts.w,opts.h,opts.color?opts.color:"white"),
            "label": (ctx,x,y,opts) => this.draw_label(
                ctx,x,y,opts.w,opts.h,
                opts.text,
                opts.color?opts.color:"white",
                opts.font?opts.font:"16px sans-serif",
                opts.align?opts.align:"center")
        }

        this.canvas = document.getElementById(attributes.render_element_id) 

        window.addEventListener('resize', e => {
            this.update_context()
        })
        this.update_context()
    }

    update_context(){
        this.ctx = this.canvas.getContext('2d')
        this.ctx.canvas.width  = window.innerWidth;
        this.ctx.canvas.height = window.innerHeight;
        this.width = this.canvas.width
        this.height = this.canvas.height
    }

    draw_square(ctx,x,y,w,h,color){
        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.strokeRect(x-w/2,y-h/2,w,h)
    }

    draw_label(ctx,x,y,h,text,color,font,align){
        ctx.font = font
        ctx.textAlign = align
        ctx.fillText(text,x,y)
    }

    execute(delta,time){
        this.ctx.clearRect(0,0,this.width,this.height)

        this.queries.draw.results.forEach( e => {
            const d = e.getComponent(Overlay2dComponent) 
            const p = e.getComponent(Project2dComponent)
            const x = p.x * this.width/2 + this.width/2 + d.offset.x
            const y = - ( p.y * this.height/2 ) + this.height/2 + d.offset.y
            this.draw_functions[d.type](this.ctx,x,y,d.opts)
        })

    }
}

Overlay2dSystem.queries = {
    draw: {
        components: [Overlay2dComponent,Project2dComponent]
    }
}