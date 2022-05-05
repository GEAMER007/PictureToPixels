var fs=require('fs')
var pako=require('pako')
function BufStartsWith(buf,val){
    var eq=true
    if(buf.length<val.length)return false
    for(var i=0;i<val.length;i++)buf[i]!=val[i]?eq=!1:1
    return eq
}
function bufCopy (buf,start,end){
    var arraybuffer=[]
    //if(buf.length<end){return Buffer.from([])}
    for (let i = start; i != end; i++) {
        if(buf[i]!==null&&buf[i]!==undefined)arraybuffer.push(buf[i])
    }
    return Buffer.from(arraybuffer)
}
function bufJoin (buf1,buf2){
    return Buffer.from([...buf1,...buf2]) 
}

function n32tonum(buf=new Buffer()){
var num='0b'
buf.forEach(n => {
    var b=n.toString(2)
    while (b.length<8)b=0+b
    num+=b
});
return Number(num)
}

function numton32(int=0){
    var bin=int.toString(2)
    while(bin.length<32)bin='0'+bin
    var bytes=[]
    bytes[0]=Number('0b'+bin.slice(0,8))
    bytes[1]=Number('0b'+bin.slice(8,16))
    bytes[2]=Number('0b'+bin.slice(16,24))
    bytes[3]=Number('0b'+bin.slice(24,32))
    return Buffer.from(bytes)
}
class Chunk{
        constructor(type,chunk_body,crc,csa,clen){
        this.chunkStartAddress=csa
        this.crc=crc
        this.data={}
        this.type=type
        this.chunk_body=chunk_body
        this._chunk_len=clen
        this.length=chunk_body.length+12
        switch (type) {
            case 'IHDR':
                this.data.width=n32tonum(bufCopy(chunk_body,0,4))
                this.data.height=n32tonum(bufCopy(chunk_body,4,8))
                this.data.depth=chunk_body[8]
                this.data.colorType=chunk_body[9]
                this.data.compression=chunk_body[10]
                this.data.filter=chunk_body[11]
                this.data.interlace=!!chunk_body[12]
                
                break;

            case 'IDAT':
                
                this.data.compressed=chunk_body
                break;
            default:
                
                break;
        }
    }
}
function readChunk(png_buffer,csa){
    var cba=csa+8
    var chunk_len=n32tonum(bufCopy(png_buffer,csa,csa+4))
    var chunk_type=bufCopy(png_buffer,csa+4,cba)
    var chunk_body=bufCopy(png_buffer,cba,cba+chunk_len)
    var crc=n32tonum(bufCopy(png_buffer,cba+chunk_len,cba+chunk_len+4))
    return new Chunk(chunk_type.toString(),chunk_body,crc,csa,chunk_len)
    
}
function findAllChunks(png_buffer){
    var chunks=[]
    var index=8
    while(true){
        if(index>=png_buffer.length)break
        var chunk=readChunk(png_buffer,index)
        index+=chunk.length
        chunks.push(chunk)
        
    }
    return chunks

}
class Pixel{
    constructor(r,g,b,a){
        this.R=r
        this.G=g
        this.B=b
        this.A=a
        
        return this
    }
}
var crc32=function(r){for(var a,o=[],c=0;c<256;c++){a=c;for(var f=0;f<8;f++)a=1&a?3988292384^a>>>1:a>>>1;o[c]=a}for(var n=-1,t=0;t<r.length;t++)n=n>>>8^o[255&(n^r[t])];return(-1^n)>>>0};


function balanceAlpha(cl1,cl2){
if(cl1.A==cl2.A)return cl2
if(cl2.A==0)return cl1
if(cl1.A==0)return cl2
var l=cl1.A+cl2.A

var r=Math.floor((cl1.R*cl1.A+cl2.R*cl2.A)/l)
var g=Math.floor((cl1.G*cl1.A+cl2.G*cl2.A)/l)
var b=Math.floor((cl1.B*cl1.A+cl2.B*cl2.A)/l)
return new Pixel(r,g,b,255)
}
class Drawer{
    constructor(){
        this.Rectangle=(pixelarray,x,y,w,h,color)=>{
            var t=typeof color
            for(var ynow=y;ynow<y+h;ynow++){
                for(var xnow=x;xnow<x+w;xnow++){
                    var i=pixelarray.coordsToIndex(xnow,ynow)
                    pixelarray.pixels[i]=balanceAlpha(pixelarray.pixels[i],t=='function'?color(xnow,ynow,i):color)
                }
            }
                
        }
        this.EmptyRectangle=(pixelarray,x,y,w,h,color)=>{
            var t=typeof color
            for(var ynow=y;ynow<y+h;ynow++){
                for(var xnow=x;xnow<x+w;xnow++){
                    var i=pixelarray.coordsToIndex(xnow,ynow)
                    //&&(x+w+1>xnow&&y+h+1>ynow&&x-1<xnow&&y-1<ynow)
                if(x==xnow||y==ynow||x+w==xnow+1||y+h==ynow+1)pixelarray.pixels[i]=balanceAlpha(pixelarray.pixels[i],t=='function'?color(xnow,ynow,i):color)
                }
            }}
            this.background=(pixelarray,color)=>{
                var t=typeof color
                for (let i = 0; i < pixelarray.pixels.length; i++) {
                    var [xnow,ynow]=pixelarray.indexToCoords(i)
                    pixelarray.pixels[i]=t=='function'?color(xnow,ynow):color
                }
            }
            this.drawImage=(pixelarray=new PixelArray(),png,x,y)=>{
                var w=png.width
                var h=png.height-1
                for(var ynow=y;ynow<y+h;ynow++){
                    for(var xnow=x;xnow<x+w;xnow++){
                        var i=pixelarray.coordsToIndex(xnow,ynow)
                    pixelarray.pixels[i]=balanceAlpha(pixelarray.pixels[i],png.pixels[png.coordsToIndex(xnow-x+1,ynow-y)])
                }}
                
            }
            
            this.Circle=(pixelarray,x,y,r,color)=>{
                var t=typeof color
                var h=r*2
                for(var ynow=y-h;ynow<y+h;ynow++){
                    for(var xnow=x-h;xnow<x+h;xnow++){
                        var i=pixelarray.coordsToIndex(xnow,ynow)
                    if(pixelarray.distance(xnow,ynow,x,y)<=r)pixelarray.pixels[i]=balanceAlpha(pixelarray.pixels[i],t=='function'?color(xnow,ynow,i):color)
                }}
            }
            
        
        this.Line=(pixelArray=new PixelArray(),x1,y1,x2,y2,color)=>{
            var dx=x2-x1
            var dy=y2-y1
            var st=Math.abs(dx)>Math.abs(dy)?Math.abs(dx):Math.abs(dy)
            var x_inc=dx/st
            var y_inc=dy/st
            var x=x1
            var y=y1
            var points=[]
            // console.log(st)
            for(var v=0; v < st; v++){
                x+=x_inc
                y+=y_inc
                points.push([Math.round(x),Math.round(y)])
            }
            for (let i = 0; i < pixelArray.pixels.length; i++) {
                var cords=pixelArray.indexToCoords(i)
                points.forEach(p=>p[0]==cords[0]&&p[1]==cords[1]?pixelArray.pixels[i]=color:0)
            }
            
        }
        this.DrawText=(pixelarray,x,y,text,font,color)=>{
            if(!font)
            return
            
            for (var i = 0; i < text.length; i++) {

            if(i > 0) x+= font.spaceBetweenChars;
            var c = text[i];
            var char = font.getChar(c);

            for (var p = 0; p < char.pixels.length; p++) {
                var pixel = char.pixels[p];
                var iii=pixelarray.coordsToIndex(x+pixel[0],y+pixel[1])
                pixelarray.pixels[iii]=color
            }

            x+= char.width;
            }
        }
        // console.log(color)
        // var sx=x1<x2?[x1,y1]:x2
        // var pxa=new PixelArray()
        // pxa.width=Math.abs(x1-x2)
        // pxa.height=Math.abs(y1-y2)
        // var pixar=[]
        // var m=(y2-y1)/(x2-x1)
        // var equationFunc=x=>m*x
        // for(var i=0;i<pxa.width*pxa.height;i++)pixar.push(1)
        // pxa.pixels=pixar
        // this.background(pxa,new Pixel(0,0,0,0))
        // for(var i=0;i<pxa.width;i++)pxa.pixels[Math.floor(-equationFunc(i-Math.floor(pxa.width)/2)+pxa.height/2)*pxa.width+i]=color
        // console.log(pxa)
        // this.drawImage(pixelArray,pxa,sx[0],sx[1]-pxa.height)
    }
}
class PixelArray{
    constructor(w,h,pixels,chunks=[new Chunk()]){
        this.pixels=[]
        this.width=w
        this.height=h
        this.chunks=chunks
        var bkgdc
        var fbKGD=!1
        chunks.forEach(c=>{
            if(fbKGD)return
            if(c.type=='bKGD'){
                bkgdc=new Pixel(c.chunk_body[1],c.chunk_body[3],c.chunk_body[5],0);
                fbKGD=!0
            }
        })
        if(fbKGD){
            for(var i=0;i<w*h;i++){
                
                this.pixels[i]=balanceAlpha(bkgdc,pixels[i])
            }
        }
        else{
            this.pixels=pixels
        }
        
        this.get=(x,y)=>{return this.pixels[x-1+y*(this.width-1)]}
        this.set=(x,y,pixel)=>{this.pixels[x-1+y*(this.width-1)]=pixel}
        this.distance=(x1,y1,x2,y2)=>{
            return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
        }
        this.coordsToIndex=(x,y)=>{
            return x+y*this.width
        }
        this.indexToCoords=(ind)=>{
            var y=Math.floor(ind/this.width)
            var x=ind-y*this.width-1
            return [x,y]
        }
        this.save=(filename,retbuf=false)=>{
            var arraybuffer=[]
            var idat_buffer=[]
            var idat_chunk_bodies=[]
            this.pixels.forEach((pix,k)=>{
                
                idat_buffer.push(pix.R,pix.G,pix.B,pix.A)
                if(k%this.width==0)idat_buffer.push(0)
            })
            idat_buffer=pako.deflate(Buffer.from(idat_buffer))
            var chunkcount=Math.ceil(idat_buffer.length/8192)
            for (let i = 0; i < chunkcount; i++) idat_chunk_bodies.push(bufCopy(idat_buffer,i*8192,i*8192+8192))
            
            
            arraybuffer.push(...Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
            var ihdr_body=Buffer.from([...numton32(this.width),...numton32(this.height), 0x08, 0x06, 0x0, 0x0, 0x0])
            var c= new Chunk('IHDR',ihdr_body,crc32(bufJoin(Buffer.from('IHDR'),ihdr_body)),8,ihdr_body.length)
            //this.chunks[0]
            var size=numton32(c._chunk_len)
            var type=Buffer.from(c.type)
            var crc=numton32(c.crc)
            var body=c.chunk_body
            arraybuffer.push(...[...size,...type,...body,...crc])
            var bkgd_body=Buffer.from([0, 255, 0, 255, 0, 255])
            var c= new Chunk('bKGD',bkgd_body,crc32(bufJoin(Buffer.from('bKGD'),bkgd_body)),8,bkgd_body.length)
            //this.chunks[0]
            var size=numton32(c._chunk_len)
            var type=Buffer.from(c.type)
            var crc=numton32(c.crc)
            var body=c.chunk_body
            arraybuffer.push(...[...size,...type,...body,...crc])
            idat_chunk_bodies.forEach(c=>{
            var size=numton32(c.length)
            var type=Buffer.from('IDAT')
            var crc=numton32(crc32(bufJoin(type,c)))
            arraybuffer.push(...[...size,...type,...c,...crc])
            })

            var c=new Chunk('IEND',Buffer.from([]),2923585666,false,0)
            var size=numton32(c._chunk_len)
            var type=Buffer.from(c.type)
            var crc=numton32(c.crc)
            var body=c.chunk_body
            arraybuffer.push(...[...size,...type,...body,...crc])
            if(retbuf){return Buffer.from(arraybuffer)}else{
            fs.writeFileSync(filename,Buffer.from(arraybuffer))}
            
        }
    }
}
function loadFont(filename){
    return require(filename)
}
function buildPixelArray(idat,width,height,chunks){
    var pixelArray=[]
    
    var offset=-1
    for(var i=1;i<idat.length;i+=4){
        (i-1)%(width*4)==0?offset++:1
        var b=offset;
        
        pixelArray.push(new Pixel(idat[i+b++],idat[i+b++],idat[i+b++],idat[i+b++]))
    }
    return new PixelArray(width,height,pixelArray,chunks,idat)
}
function BuildPNG(width,height,background=new Pixel(0,0,0,255)){
    var pixar=bpxr(width*height)
    var d=new Drawer()
    var pixelArray=new PixelArray(width,height,pixar,bchks(pixar,width,height))
    d.background(pixelArray,background)
    return pixelArray
}
function bpxr(count){
    var arr=[]
    for (let i = 0; i < count; i++)arr.push(new Pixel(0,0,0,255))
    return arr
}
function bchks(pixs,width,height){
var arr=[]
var idat_buffer=[]
var idat_chunk_bodies=[]
pixs.forEach((pix,k)=>{      
    idat_buffer.push(pix.R,pix.G,pix.B,pix.A)
    if(k%this.width==0)idat_buffer.push(0)
})

idat_buffer=pako.deflate(Buffer.from(idat_buffer))
var chunkcount=Math.ceil(idat_buffer.length/8192)
for (let i = 0; i < chunkcount; i++) idat_chunk_bodies.push(bufCopy(idat_buffer,i*8192,i*8192+8192))
var ihdr_body=Buffer.from([...numton32(width),...numton32(height), 0x08, 0x06, 0x0, 0x0, 0x0])
arr[0]=new Chunk('IHDR',ihdr_body,crc32(bufJoin(Buffer.from('IHDR'),ihdr_body)),false,ihdr_body.length)
idat_chunk_bodies.forEach(c=>arr.push(new Chunk('IDAT',c,crc32(bufJoin(Buffer.from('IDAT'),c)),false,c.length)))
arr.push(new Chunk('IEND',Buffer.from([]),2923585666,false,0))
return arr
}

function loadPNG(filename){
var png_buffer=fs.readFileSync(filename)
if(!BufStartsWith(png_buffer,Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))){
    console.log('not a png')
    return false
}
else{
    var chunks=findAllChunks(png_buffer)
    var IDAT_COMPRESSED=[]
    chunks.forEach(c=>c.type=='IDAT'?IDAT_COMPRESSED.push(...c.data.compressed):1)
    // fs.writeFileSync('comp.txt',Buffer)
    var pixelArray=buildPixelArray(pako.inflate(Buffer.from(IDAT_COMPRESSED)),chunks[0].data.width,chunks[0].data.height,chunks)
    
    return pixelArray
}
}
module.exports={
    Chunk:Chunk,
    Pixel:Pixel,
    Drawer:Drawer,
    PixelArray:PixelArray,
    bufCopy:bufCopy,
    bufJoin,
    n32tonum:n32tonum,
    numton32:numton32,
    loadPNG:loadPNG,
    loadFont:loadFont,
    BuildPNG:BuildPNG,
    crc32:crc32,
    bpxr:bpxr,
    bchks:bchks,
    findAllChunks:findAllChunks

}