class Block {
    constructor() {
        this.offset = {
            x: 0,
            y: 0,
        }
    }
    rotate(){
        throw 'Error : can not override !';
    }
}

class BarBlock extends Block {
    constructor() {
        super()
        this.width = 4;
        this.matrix = [
            1,1,1,1,
        ];
    }
    rotate(){
        return 1;
   }
}

class TBlock extends Block {
    constructor() {
        super()
        this.width = 3;
        this.matrix = [
            1,1,1,
            0,1,0
        ];
    }
    rotate(){
        return 2;
    }
}

class SquareBlock extends Block {
    constructor() {
        super()
        this.width = 2;
        this.matrix = [
            1,1,
            1,1
        ];
    }
    rotate(){  
        return 3; 
    }
}

class StairsBlock extends Block {
    constructor() {
        super()
        this.width = 3;
        this.matrix = [
            0,1,1,
            1,1,0
        ];
    }
    rotate(){ 
        return 4;  
    }
}

var app = new Vue({
    el: '#app',
    data: {
        config: {
            width: 10,
            height: 10,
            interval: 600,
            blockSize: 30,
        },
        stageWidth: 0,
        stageMatrix: [],
        currentBlock: null,
        points: 0,
        rotateCount: 0,
    },
    mounted(){
        let width = this.config.width;
        let height = this.config.height;
        let blockSize = this.config.blockSize;
        this.stageWidth = width * blockSize;
        this.stageMatrix = new Array(width*height).fill(0);
        let vm = this;
        document.addEventListener("keydown",function(ev){
            if(ev.key === 'ArrowLeft'){
                vm.moveLeft();
            }
            if(ev.key === 'ArrowRight'){
                vm.moveRight();
            }
            if(ev.key === 'ArrowUp'){
                vm.rotate();
            }
            if(ev.key === 'ArrowDown'){
                if(vm.checkStageIndex(0,-1,0)){
                    vm.moveDown();
                } else {
                    return false;
                }
            }
        });
    },
    computed: {
        displayMatrix: function(){
            let cb = this.currentBlock;
            let sm = this.stageMatrix.slice();

            if(cb === null){
                return sm;
            }

            let blockWidth = cb.width;
            let blockOffset = this.currentBlock.offset;
            let blockMatrix = this.currentBlock.matrix;
            let configWidth = this.config.width;

            for (let i = 0; i < blockMatrix.length ; i++){
                let value = blockMatrix[i];
                let x = i%blockWidth + blockOffset.x;
                let y = Math.floor(i/blockWidth)  + blockOffset.y;
                let map = y*configWidth + x;
                sm[map] = value;
            }
            
            return sm;
        }
    },
    methods: {
        gameStart: function(){
            this.makeBlock();
        },
        makeBlock: function(){
            this.rotateCount = 0;

            let num = Math.floor(Math.random()*4+1);

            // ブロックをランダムに生成
            if(num === 1){
                this.currentBlock = new BarBlock();
            } else if (num === 2){
                this.currentBlock =  new TBlock();
            } else if(num === 3){
                this.currentBlock = new SquareBlock();
            } else if(num === 4){
                this.currentBlock = new StairsBlock();
            }
            
            this.addBlockToStage();
        },
        addBlockToStage(){
            let x = Math.floor((this.config.width - this.currentBlock.width)/2);    
            this.currentBlock.offset.x = x; 
            this.currentBlock.offset.y = 0;

            this.dropBlock();
        },
        dropBlock() {
            let interval = this.config.interval;

            let timer = setInterval(()=>{
                let result = this.checkStageIndex(0,1,0);
                if(!result){
                    this.mergeCurrentToStage();
                    clearInterval(timer);
                } else {
                    this.moveDown();
                }
            },interval);
        },
        mergeCurrentToStage(){
            let cb = this.currentBlock;
            let blockWidth = cb.width;
            let blockOffset = this.currentBlock.offset;
            let blockMatrix = this.currentBlock.matrix;
            let configWidth = this.config.width;

            for (let i = 0; i < blockMatrix.length ; i++){
                let value = blockMatrix[i];
                let x = i%blockWidth + blockOffset.x;
                let y = Math.floor(i/blockWidth)  + blockOffset.y;
                let map = y*configWidth + x;
                if(this.stageMatrix[map] === 0){
                    Vue.set(this.stageMatrix,map,value);
                }
            }

            this.gameOver();
            this.checkRow();
            this.makeBlock();
        },
        checkStageIndex(plusX,plusY,plusW){
            let cboy = this.currentBlock.offset.y;
            let cbox = this.currentBlock.offset.x;
            let cbw = this.currentBlock.width;
            let cbm = this.currentBlock.matrix;
            let cbml = this.currentBlock.matrix.length;
            let sm = this.stageMatrix;

            //向かう先をチェックするため
            cbox += plusX;
            cboy += plusY;
            //ブロックの長さの変化を許容できるかチェックするため
            cbw += plusW;
            
            for(let index = 0; index < cbml ; index++){
                let targetCol = Math.floor(index/cbw);
                let stageIndex = this.getStageIndex(cbox,cboy,targetCol,index,cbw);
                let smIndex = sm[stageIndex];
                let cbIndex = cbm[index];

                if((smIndex === 1 && cbIndex === 1) || !stageIndex){
                    return false;
                }
            }
            return true;
        },
        moveLeft: function(){
            let checker = this.checkStageIndex(-1,0,0);
            if(this.currentBlock.offset.x > 0 && checker){
                this.currentBlock.offset.x -= 1;
            }
        },
        moveRight: function(){
            let stageWidth = this.config.width;
            let cbw = this.currentBlock.width;
            let blockRightX = this.currentBlock.offset.x + cbw;
            let checker = this.checkStageIndex(1,0,0);
            if(blockRightX < stageWidth && checker){
                this.currentBlock.offset.x += 1;
            }
        },
        moveDown: function(){
            this.currentBlock.offset.y += 1;
        },
        getStageIndex(blockX,blockY,targetCol,blockIndex,blockWidth) {
            let stageWidth = this.config.width;
            let index = (blockY + targetCol) * stageWidth + blockX + 
            (blockIndex - (blockWidth*targetCol));
            let maxIndex = this.config.width * this.config.height -1;

            if(index > maxIndex || index < 0){
                return false;
            } else {
                return index;
            }
        },
        rotate: function(){
            let cbw = this.currentBlock.width;
            let cbm = this.currentBlock.matrix;
            let cbh = cbm.length / cbw;
            let rotate = this.currentBlock.rotate();
            let count = this.rotateCount;
            let stageWidth = this.config.width;
            let blockRightX = this.currentBlock.offset.x + cbw;

            if (rotate === 1){
                //BarBlock
                if(count%2 !== 0){
                    blockRightX += 3;
                    if(blockRightX > stageWidth){
                        return false;
                    }
                    let checker = this.checkStageIndex(0,0,3)
                    if(!checker){
                        return false;
                    }
                } else {
                    let checker = this.checkStageIndex(0,0,-3)
                    if(!checker){
                        return false;
                    }
                }

                this.currentBlock.width = cbh;
                this.rotateCount += 1;
                
            } else if (rotate === 2) {
                //TBlock
                if(cbh === 2){
                    let checker = this.checkStageIndex(1,1,-1)
                    if(!checker){
                        return false;
                    }
                    if(count === 2 || count%4 !== 0){
                        const array = [1,0,1,1,1,0];
                        this.currentBlock.matrix = array;
                    } else {
                        const array = [0,1,1,1,0,1];
                        this.currentBlock.matrix = array;
                    }
                    this.currentBlock.offset.x += 1;
                    this.currentBlock.offset.y += 1;
                } else {
                    if(this.currentBlock.offset.x -1 < 0){
                        return false;
                    }
                    let checker = this.checkStageIndex(-1,1,1)
                    if(!checker){
                        return false;
                    }
                    if(count === 3 || count%4 !== 1){
                        const array = [1,1,1,0,1,0];
                        this.currentBlock.matrix = array;
                    } else {
                        const array = [0,1,0,1,1,1];
                        this.currentBlock.matrix = array;
                    }
                    this.currentBlock.offset.x -= 1;
                    this.currentBlock.offset.y += 1;
                }
                
                this.currentBlock.width = cbh;
                this.rotateCount += 1;

            } else if (rotate === 3) {
                //SquareBlock
                return false;
            } else if (rotate === 4) {
                //StairsBlock
                if(cbh === 2){
                    let checker = this.checkStageIndex(1,1,1)
                    if(!checker){
                        return false;
                    }
                    const array = [1,0,1,1,0,1];
                    this.currentBlock.matrix = array;
                    this.currentBlock.offset.x += 1;
                    this.currentBlock.offset.y += 1;
                } else {
                    let checker = this.checkStageIndex(-1,1,-1)
                    if(!checker){
                        return false;
                    }
                    const array = [0,1,1,1,1,0];
                    this.currentBlock.matrix = array;
                    this.currentBlock.offset.x -= 1;
                    this.currentBlock.offset.y += 1;
                }
                
                this.currentBlock.width = cbh;
            } else {
                return false;
            }
        },
        checkRow: function(){
            let stage = this.stageMatrix;
            let stageWidth = this.config.width;
            let count = stage.length / stageWidth;
            let rows = [];

            for(let i = 0 ; i < count ; i ++){
                let startIndex = count * i ;
                let endIndex = startIndex + count;
                let slicedRow = stage.slice(startIndex,endIndex);
                rows.push(slicedRow);
            }
            
            for(let i = 0 ; i < rows.length ; i++){
                let targetRow = rows[i];
                let checker = 1;
                for( let n = 0 ; n < targetRow.length ; n++){
                    if(targetRow[n] === 0 ){
                        checker = 0;
                    }
                }
                if(checker === 1){
                    this.clearRow(i);
                }
            }
        },
        clearRow: function(targetRow){
            let stageWidth = this.config.width;
            let startIndex = targetRow*stageWidth;
            
            for(let i = 0 ; i < stageWidth ; i++){
                let index = startIndex + i;
                Vue.set(this.stageMatrix,index,0);
            }
            
            this.points += 10;
            this.cleanStage(startIndex,stageWidth);
        },
        cleanStage: function(startIndex,stageWidth){
            let temp = this.stageMatrix;

            for(let i = (startIndex - 1) ; i >= 0 ; i-- ){
                let value = temp[i];
                if(value === 1 ){
                    let ifMoveDown = i + stageWidth;
                    if(this.stageMatrix[ifMoveDown] === 0){
                        Vue.set(this.stageMatrix,i,0); 
                        Vue.set(this.stageMatrix,ifMoveDown,1); 
                    }
                }
            }
        },
        gameOver: function(){
            let firstRowEnd = this.config.width;
            for(let i = 0 ; i < firstRowEnd ; i ++){
                if(this.stageMatrix[i] === 1){
                    if(confirm('GAME OVER!')){
                        location.reload();
                        return false;
                    }
                }
            }
        }
    },
});



