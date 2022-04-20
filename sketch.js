
var fs=require('fs')
var {
    Chunk,Pixel,Drawer,PixelArray,bufCopy,n32tonum,numton32,loadPNG,BuildPNG,crc32,bufJoin, loadFont
}=require('./index')
atp=require('./AnyToPNG/atp')
var d=new Drawer()
var f=Math.floor
var r=Math.round
//console.log()new Pixel(200,100,100,255)


function BuildGraph (width,height,equationFunc=x=>x*2,bcolor=new Pixel(0,0,0,255),ccolor=new Pixel(255,255,255,255),lcolor=new Pixel(255,2,2,255)){
    var graph=BuildPNG(width,height,bcolor)
    for(var i=0;i<graph.height;i++)graph.pixels[i*graph.width+f(graph.width/2)]=ccolor
    for(var i=0;i<graph.width;i++)graph.pixels[f(graph.width/2)*graph.width+i]=ccolor
    for(var i=0;i<graph.width;i++)graph.pixels[f(-equationFunc(i-f(graph.width)/2,i)+graph.height/2)*graph.width+i]=lcolor
    return graph
}


// var fnt=loadFont('./default_font')
function PrintStatsOnGraph(graph,lookupTable,PPU=1,x_offset=10,div=2,statColor=new Pixel(255,2,2,255),pointColor=statColor,pointSize=2){
    var sector=f(graph.width/lookupTable.length)
    var d=new Drawer()
    lookupTable.forEach((v,k)=>{
        var k2=k+1
        var v2=lookupTable[k2]*PPU
        v*=PPU
        var x0=f(k*sector)+x_offset
        var y0=f(graph.height/div-v)
        var x1=f(k2*sector)+x_offset
        var y1=f(graph.height/div-v2)
        d.DrawText(png,x0,y0-15,v/PPU+'',fnt,pointColor)
        if(k==lookupTable.length-1)return
        // console.log(x0,y0,x1,y1)
        d.Circle(graph,x0,y0,pointSize,pointColor)
        d.Circle(graph,x1,y1,pointSize,pointColor)
        // graph.set(k*sector,v,statColor)
        d.Line(graph,x0,y0,x1,y1,statColor)
    })
}


// var players=[
//     2,0,0,1,1,3,5,5,10,21,20,19
// ]
function safeClamp(v,m){
    while(v>m)v-=m
    return r(Math.abs(v))
}

// var png=BuildPNG(100,100)
// d.DrawText(png,25,50,'No Data',loadFont('./default_font.js'), new Pixel(255,100,100,255))
// png.save('unk.png')
// console.log(png)


// var x=r(20*(x/500))
// var y=r(250*(y/500))
// return new Pixel(x,y,255,255)

// console.log()
//console.log(png.chunks)
// d.Circle(png,100,200,50,new Pixel(200,100,255,255))
// d.EmptyRectangle(png,100,200,10,10,new Pixel(250,250,250,255))

// PrintStatsOnGraph(png,players,3,40,1.5,new Pixel(100,250,100,255),new Pixel(200,100,250,255),3)

// var text=`igroki`
// var y=10
// var clr=new Pixel(255,255,255,255)
// for (var c in text){y+=10;d.DrawText(png,100,y,text[c],fnt,clr)}



// x=>f(180*Math.cos(x*Math.PI/180))

//BuildPNG(100,100,new Pixel(0,0,0,0))
// function numtopixel (num=0xffffff){
//     var hex=num.toString(16)
//     while(hex.length<6)hex=0+hex
//     return new Pixel(Number('0x'+hex.slice(0,2)),Number('0x'+hex.slice(2,4)),Number('0x'+hex.slice(4,6)),255)
// }
// d.background(png,(x,y)=>{
//     var a=(x+y+100)/10
//     while(a>127)a-=255
//     a=Math.abs(a)
//     return new Pixel(a,100,a,255)
// })

//d.Rectangle(png,100,50,50,40,new Pixel(100,50,50,251))
// d.Rectangle(png,250,30,100,100,new Pixel(0,0,0,0))
//d.background(png,
//var a=(x,y)=>{while(x>127)x=Math.abs(x-255);while(y>127)y=Math.abs(y-255); return new Pixel(x,y,(x+y)/2,255)}
//)
//d.Circle(png,50,50,25,(x,y)=>{while(x>127)x=Math.abs(x-255);while(y>127)y=Math.abs(y-255); return new Pixel(x,y,x,255)})
// d.Circle(png,250,100,30,(x,y)=>{while(x>127)x=Math.abs(x-255);while(y>127)y=Math.abs(y-255); return new Pixel(x,x,y,255)})
// d.Circle(png,400,100,30,(x,y)=>{while(x>127)x=Math.abs(x-255);while(y>127)y=Math.abs(y-255); return new Pixel(y,x,y,255)})

setTimeout(()=>{},1000000)