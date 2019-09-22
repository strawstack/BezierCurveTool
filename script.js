class CurveTool {
    constructor(svg) {
        this.svg = svg;
        this.state = {
            points: [[332, 143], [241, 127], [364, 148], [357, 211], [415, 346], [399, 437], [336, 532], [314, 648], [291, 668], [250, 630], [243, 440], [174, 392], [185, 301], [215, 258]],
            //points: [[40, 10], [10, 80], [65, 10], [95, 80]],
            target: undefined
        };
        this.listen();
        this.renderState(); // TODO - debug remove
    }
    updateTarget(x, y) {
        // Track movement delta
        let delta = {
            x: x - this.state.points[this.state.target][0],
            y: y - this.state.points[this.state.target][1]
        };

        // Move selected point
        this.state.points[this.state.target][0] = x;
        this.state.points[this.state.target][1] = y;

        // Possibly move attached control point
        if (this.state.target % 2 === 1) {
            this.state.points[this.state.target - 1][0] += delta.x;
            this.state.points[this.state.target - 1][1] += delta.y;
        }
    }
    listen() {
        this.svg.addEventListener("mouseup", (e) => {
            this.state.target = undefined;
            this.renderState();
        });
        this.svg.addEventListener("mousemove", (e) => {
            if (this.state.target !== undefined) {
                this.updateTarget(e.offsetX, e.offsetY);
                this.renderState();
            }
        });
        this.svg.addEventListener("mousedown", (e) => {
            this.state.points.push([e.offsetX, e.offsetY]);
            this.state.points.push([e.offsetX, e.offsetY + 35]);
            this.renderState();
        });
    }
    copy() {
        return false // deep copy of state
    }
    makeHandle(coord) {
        var n = "http://www.w3.org/2000/svg";
        let handle = document.createElementNS(n, "circle");
        handle.setAttributeNS(null, "cx", coord[0]);
        handle.setAttributeNS(null, "cy", coord[1]);
        handle.setAttributeNS(null, "r", 8);
        return handle;
    }
    makeControlHandle(coord) {
        let handle = this.makeHandle(coord);
        handle.setAttributeNS(null, "class", "hollow");
        return handle;
    }
    makeLine(source, dest) {
        var n = "http://www.w3.org/2000/svg";
        let line = document.createElementNS(n, "line");
        line.setAttributeNS(null, "x1", source[0]);
        line.setAttributeNS(null, "y1", source[1]);
        line.setAttributeNS(null, "x2", dest[0]);
        line.setAttributeNS(null, "y2", dest[1]);
        line.setAttributeNS(null, "stroke", "lightsalmon");
        line.setAttributeNS(null, "stroke-width", 1);
        return line;
    }
    renderState() {

        // Clear the SVG
        // TODO - this should be a "g" tag in the SVG
        // to prevent loss of user data
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }

        // Create the path element
        var n = "http://www.w3.org/2000/svg";
        let path = document.createElementNS(n, "path");
        let d = "M " + this.state.points[1].join(" ");
        d += " C " + this.state.points[0].join(" ");
        d += ", " + this.state.points[2].join(" ") + ", " +  this.state.points[3].join(" ");

        for (let i = 4; i < this.state.points.length - 1; i += 2) {
            d += " S " + this.state.points[i].join(" ") + ", " + this.state.points[i + 1].join(" ");
        }
        if (d !== "")
            path.setAttributeNS(null, "d", d);

        // Append path to SVG element
        this.svg.appendChild(path);

        // Place handles on top of existing curve
        // and bind events
        let c = undefined;
        for (let i = 0; i < this.state.points.length; i++) {
            let coord = this.state.points[i];

            if (i % 2 === 0) {
                c = this.makeControlHandle(coord);
                let line = this.makeLine(coord, this.state.points[i + 1]);
                this.svg.appendChild(line);

            } else {
                c = this.makeHandle(coord);
            }

            c.addEventListener('mousedown', (e) => {
                if (e.shiftKey && i % 2 === 1 && this.state.points.length > 4) {
                    this.state.points.splice(i - 1, 2);
                } else {
                    this.state.target = i;
                }
                this.renderState();
                e.stopPropagation();
            });
            this.svg.appendChild(c);
        }
    }
}

function main() {
    let svg = document.querySelector("svg");
    let c = new CurveTool(svg);
}

window.onload = main;
