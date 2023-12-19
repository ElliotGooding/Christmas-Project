export class Box {
    constructor(x, y, z, width, height, depth) {
        this.x = x;
        this.y = y;
        this.z = z;
        
        this.width = width;
        this.height= height;
        this.depth = depth;

        this.left = this.x - this.width/2;
        this.right = this.x + this.width/2;
        this.top = this.y + this.height/2;
        this.bottom = this.y - this.height/2;
        this.front = this.z + this.depth/2;
        this.back = this.z - this.depth/2;

        this.solid = true
    }
}