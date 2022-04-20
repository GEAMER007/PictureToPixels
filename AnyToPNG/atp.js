var {
    Chunk,Pixel,Drawer,PixelArray,bufCopy,n32tonum,numton32,loadPNG,BuildPNG,crc32,bufJoin,loadFont,bchks,findAllChunks
}=require('../index')
var pako=require('pako')
var fs=require('fs')
var mode =process.argv[2]
var funcs={

    encode:function encode(argv){
        var width=argv[3]-0
        var height=argv[4]-0
        var input=argv[5]
        var output=argv[6]
        var inbuf;
        if(fs.existsSync(input)){inbuf=fs.readFileSync(input)}else{console.log('File not found');process.exit(1)}
        if(inbuf.length>1024*1024*1024*4-10){console.log('File too big\nMax file size: 3.9GB.');process.exit(1)}
    if(width*height<inbuf.length){var rec=Math.floor(Math.sqrt(inbuf.length)+10);console.log(`File doesnt fit into ${width}x${height}. specify higher dimensions to fix.\n${width}x${height}<${inbuf.length}\nReccomended dimensions: ${rec}x${rec}`);process.exit(1)}
    var lenbuf=numton32(inbuf.length)
    var arraybuffer=[]
    var idat_chunk_bodies=[]
    
    var idat_buffer=pako.deflate(Buffer.concat([lenbuf,inbuf]))
    
    var chunkcount=Math.ceil(idat_buffer.length/8192)
    for (let i = 0; i < chunkcount; i++) idat_chunk_bodies.push(bufCopy(idat_buffer,i*8192,i*8192+8192))
    
    
    arraybuffer.push(...Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    var ihdr_body=Buffer.from([...numton32(width),...numton32(height), 0x08, 0x06, 0x0, 0x0, 0x0])
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
    fs.writeFileSync(output,Buffer.from(arraybuffer))
},
decode:function decode (argv){
    var input=argv[3]
    var output=argv[4]
    var inbuf;
    if(fs.existsSync(input)){inbuf=fs.readFileSync(input)}else{console.log('File not found');process.exit(1)}
    var chks=findAllChunks(inbuf)
    var outbuf=[]
    chks.forEach(c=>c.type=='IDAT'?outbuf.push(...c.data.compressed):1)
    var buf=Array.from(pako.inflate(Buffer.from(outbuf)))
    //fs.writeFileSync('./temp.txt',Buffer.from(buf))
    var len=buf.splice(0,4)
    console.log(len)
    buf=buf.splice(0,n32tonum(len))
    // console.log(len,buf)
    fs.writeFileSync(output,Buffer.from(buf))
},
unhide:function unhide (argv){
    var input=argv[2]
    var output=argv[3]
    var inbuf;
    if(fs.existsSync(input)){inbuf=fs.readFileSync(input)}else{console.log('File not found');process.exit(1)}
    var chks=findAllChunks(inbuf)
    var outbuf=[]
    chks.forEach(c=>c.type=='FHDN'?outbuf.push(...c.data.compressed):1)
    console.log(outbuf)
    var buf=Array.from(pako.inflate(Buffer.from(outbuf)))
    //fs.writeFileSync('./temp.txt',Buffer.from(buf))
    var len=buf.splice(0,4)
    console.log(len)
    buf=buf.splice(0,n32tonum(len))
    // console.log(len,buf)
    fs.writeFileSync(output,Buffer.from(buf))
},
hide:function hide(argv){
    var mask=argv[3]
    var input=argv[4]
    var output=argv[5]
    var maskbuf;
    var inbuf;
    if(fs.existsSync(mask)){maskbuf=fs.readFileSync(mask)}else{console.log('mask file not found');process.exit(1)}
    if(fs.existsSync(input)){inbuf=fs.readFileSync(input)}else{console.log('input file not found');process.exit(1)}
    if(inbuf.length>1024*1024*1024*4-10){console.log('File too big\nMax file size: 3.9GB.');process.exit(1)}
    
    var lenbuf=numton32(inbuf.length)
    var arraybuffer=Array.from(maskbuf)
    var idat_chunk_bodies=[]
    
    var idat_buffer=pako.deflate(Buffer.concat([lenbuf,inbuf]))
    
    var chunkcount=Math.ceil(idat_buffer.length/8192)
    for (let i = 0; i < chunkcount; i++) idat_chunk_bodies.push(bufCopy(idat_buffer,i*8192,i*8192+8192))
    
    const chdr=[0x46,0x48,0x44,0x4e]
    idat_chunk_bodies.forEach(c=>{
        var size=numton32(c.length)
        var crc=numton32(crc32(bufJoin(chdr,c)))
        arraybuffer.push(...[...size,...chdr,...c,...crc])
    })
    fs.writeFileSync(output,Buffer.from(arraybuffer))
}
}

switch (mode){
    case '-unhide':
        funcs.unhide(process.argv)
        break
        case '-hide':
            funcs.hide(process.argv)
            break;
            case '-encode':
                funcs.encode(process.argv)
                break;
                case '-decode':
            funcs.decode(process.argv)
                break
                default:
                    console.log(`
mode "${mode}" doesnt exist
Available modes:
-encode <width> <height> "<input>" "<output>"
-decode "<input>" "<output>"
-hide "<mask>" "<input>" "<output>"
-unhide "<input>" "<output>"`);
                    break
                }
module.exports =funcs