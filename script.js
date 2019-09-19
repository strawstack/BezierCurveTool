class MovePoint {
    constructor(x, y) {
        this.type = "m";
        this.x = x;
        this.y = y;
    }
    isDefined() {
        return this.x !== undefined;
    }
    updatePoint(x, y) {
        this.x = x;
        this.y = y;
    }
}
MovePoint.prototype.toString = function() {
    return `M ${this.x} ${this.y}`;
}

class ControlPoint {
    constructor(ax, ay, bx, by, x, y) {
        this.type = "c";
        this.points = [
            [ax, ay],
            [bx, by],
            [x, y]];
    }
    isDefined() {
        return this.points[0][0] !== undefined;
    }
    updatePoint(x, y, index) {
        this.points[index][0] = x;
        this.points[index][1] = y;
    }
}
ControlPoint.prototype.toString = function() {
    let points = this.points.map((p) => p[0] + " " + p[1]).join(", ");
    return `C ${points}`;
}

class SPoint {
    constructor(ax, ay, x, y) {
        this.type = "s";
        this.points = [
            [ax, ay],
            [x, y]];
    }
    isDefined() {
        return this.points[0][0] !== undefined;
    }
    updatePoint(x, y, index) {
        this.points[index][0] = x;
        this.points[index][1] = y;
    }
}
SPoint.prototype.toString = function() {
    let points = this.points.map((p) => p[0] + " " + p[1]).join(", ");
    return `S ${points}`;
}

class CurveTool {
    constructor(svg) {
        this.svg = svg;
        this.state = {
            points: {
                // M 10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80
                m: new MovePoint(10, 80),
                c: new ControlPoint(40, 10, 65, 10, 95, 80),
                s: [new SPoint(150, 150, 180, 80)]
            },
            target: {
                type: undefined,
                index: undefined
            }
        };
        this.listen();
        this.renderState(); // TODO - debug remove
    }
    updateTarget(x, y) {
        switch(this.state.target.type) {
            case "m":
                this.state.points.m.updatePoint(x, y);
            break;
            case "c":
                this.state.points.c.updatePoint(x, y, this.state.target.index);
            break;
            case "s":
                this.state.points.s[this.state.target.pointIndex].updatePoint(x, y, this.state.target.index);
            break;
        }
    }
    listen() {
        this.svg.addEventListener("mouseup", (e) => {
            this.state.target = {
                type: undefined,
                pointIndex: undefined,
                index: undefined
            };
            this.renderState();
        });
        this.svg.addEventListener("mousemove", (e) => {
            if (this.state.target.type !== undefined) {
                this.updateTarget(e.offsetX, e.offsetY);
                this.renderState();
            }
        });
    }
    copy() {
        return false // deep copy of state
    }
    getCoordFromPointType(point) {
        switch (point.type) {
            case "m":
                return [point.x, point.y];
            break;
            case "c":
                return [point.points[2][0], point.points[2][1]];
            break;
            case "s":
                return [point.points[1][0], point.points[1][1]];
            break;
        }
    }
    getControlCoordFromPointType(point, index) {
        switch (point.type) {
            case "c":
                return [point.points[index][0], point.points[index][1]];
            break;
            case "s":
                return [point.points[0][0], point.points[0][1]];
            break;
        }
    }
    makeHandle(point) {
        let coord = this.getCoordFromPointType(point);

        // Create element
        var n = "http://www.w3.org/2000/svg";
        let handle = document.createElementNS(n, "circle");
        handle.setAttributeNS(null, "cx", coord[0]);
        handle.setAttributeNS(null, "cy", coord[1]);
        handle.setAttributeNS(null, "r", 8);
        return handle;
    }
    makeControlHandle(point, index) {
        let coord = this.getControlCoordFromPointType(point, index);

        // Create element
        var n = "http://www.w3.org/2000/svg";
        let handle = document.createElementNS(n, "circle");
        handle.setAttributeNS(null, "class", "hollow");
        handle.setAttributeNS(null, "cx", coord[0]);
        handle.setAttributeNS(null, "cy", coord[1]);
        handle.setAttributeNS(null, "r", 8);
        return handle;
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

        let d = this.state.points.m.toString() + " ";
        d += this.state.points.c.toString() + " ";
        d += this.state.points.s.map((s) => s.toString() + " ").join(" ");

        path.setAttributeNS(null, "d", d);

        // Append path to SVG element
        this.svg.appendChild(path);

        // Place handles on top of existing curve
        // and bind events
        let c = this.makeHandle(this.state.points.m);
        c.addEventListener('mousedown', (e) => {
            this.state.target = {
                type: "m",
                index: undefined
            };
            this.renderState();
        });
        this.svg.appendChild(c);

        c = this.makeHandle(this.state.points.c);
        c.addEventListener('mousedown', (e) => {
            this.state.target = {
                type: "c",
                index: 2
            };
            this.renderState();
        });
        this.svg.appendChild(c);

        for (let i in this.state.points.s) {
            let sPoint = this.state.points.s[i];
            c = this.makeHandle(sPoint);
            c.addEventListener('mousedown', (e) => {
                this.state.target = {
                    type: "s",
                    pointIndex: i,
                    index: 1
                };
                this.renderState();
            });
            this.svg.appendChild(c);
        }

        // Place handles at control points
        // with attaching lines
        c = this.makeControlHandle(this.state.points.c, 0);
        c.addEventListener('mousedown', (e) => {
            this.state.target = {
                type: "c",
                index: 0
            };
            this.renderState();
        });
        this.svg.appendChild(c);

        c = this.makeControlHandle(this.state.points.c, 1);
        c.addEventListener('mousedown', (e) => {
            this.state.target = {
                type: "c",
                index: 1
            };
            this.renderState();
        });
        this.svg.appendChild(c);

        for (let i in this.state.points.s) {
            let sPoint = this.state.points.s[i];
            c = this.makeControlHandle(sPoint);
            c.addEventListener('mousedown', (e) => {
                this.state.target = {
                    type: "s",
                    pointIndex: i,
                    index: 0
                };
                this.renderState();
            });
            this.svg.appendChild(c);
        }

        /*
        let anchor = this.getCoordFromPointType(point);
        if (index === 0)
            anchor = this.getCoordFromPointType(this.state.points.m); // special case for type "c" point
        */

    }
}

function main() {
    let svg = document.querySelector("svg");
    let c = new CurveTool(svg);
}

window.onload = main;
