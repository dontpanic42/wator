var Wator = {};

Wator.const = {
	breedTime : [4, 12],
	starvTime : 10,
	color : [
		((255) << 24) + (255 << 8),
		((255) << 24) + (255 << 16 )
	],
	tileSize: 4
}

Wator.Renderer = function(field) {
	this.field = field;

	this.canvas = $('<canvas></canvas>')
		.width(this.field.w * Wator.const.tileSize)
		.height(this.field.h * Wator.const.tileSize);
	this.canvas.get(0).width = this.field.w;
	this.canvas.get(0).height = this.field.h;

	this.context = this.canvas.get(0).getContext("2d");

	//image-rendering: nearest-neighbour for chrome
	if(this.context.webkitImageSmoothingEnabled)
 		this.context.webkitImageSmoothingEnabled = false

	$('body')
	.append(this.canvas)
	.append(
		$('<div>U</div>')
		.click(this.loop.bind(this))
		.css('border', '1px solid black')
	);
}

Wator.Renderer.prototype.loop = function() {
	console.time("Update");
	this.update();
	console.timeEnd("Update");

	console.time("Render");
	this.render();
	console.timeEnd("Render");
}

Wator.Renderer.prototype.render = function() {
	var entity;

	this.context.clearRect(0, 0, 
		this.field.w,
		this.field.h);


	var colors = Wator.const.color;


	var imageData = this.context.createImageData(this.field.w, this.field.h);
	var data = imageData.data;
	var buffer = new ArrayBuffer(data.length);
	var buffer8 = new Uint8ClampedArray(buffer);
	var data32 = new Uint32Array(buffer);

	var list = this.field.entityList, entity;
	var len = list.length;
	for(var i = 0; i < len; i++) {
		if(!(entity = list[i])) continue;
		data32[(this.field.w * entity.position[1]) + entity.position[0]] = colors[entity.type];
	}


	data.set(buffer8);
	this.context.putImageData(imageData, 0, 0);
}

Wator.Renderer.prototype.update = function() {
	var len = this.field.entityList.length, ent;
	for(var i = 0; i < len; i++) {
		if(!(ent = this.field.entityList[i])) continue;
		ent.update();
	}
}

Wator.GameField = function(w, h) {
	this.w = w;
	this.h = h;

	this.entityList = [];
	this.freeList = [];
	
	this.entityMap  = new Array(w);

	for(var x = 0; x < w; x++) {
		this.entityMap[x] = new Array(h);
		for(var y = 0; y < w; y++) 
			this.entityMap[x][y] = null;
	}

	this.wrapCacheY = new Array(h+2);
	for(var y = 0; y < h+2; y++)
		this.wrapCacheY[y] = (y==0)? this.h - 1 : (y - 1 >= this.h)? 0 : y - 1;

	this.wrapCacheX = new Array(w+2);
	for(var x = 0; x < w+2; x++)
		this.wrapCacheX[x] = (x==0)? this.w - 1 : (x - 1 >= this.w)? 0 : x - 1;

	this.creatureCache = [
		new Array(w*h),
		new Array(w*h)
	];

	for(var i = 0; i < w*h; i++)
		this.creatureCache[0][i] = new Wator.Creature(this, 0);
	for(var i = 0; i < w*h; i++)
		this.creatureCache[1][i] = new Wator.Creature(this, 1);
}

Wator.GameField.prototype.add = function(entity) {
	this.entityMap[entity.position[0]][entity.position[1]] = entity;

	if(this.freeList.length > 0) {
		var index = this.freeList.pop();
		this.entityList[index] = entity;
		entity.index = index;
	} else {
		var index = this.entityList.length;
		this.entityList[index] = entity;
		entity.index = index;
	}	
}

Wator.GameField.prototype.getFree = function(position) {	

	var free = new Array(8), counter = 0,
		py = position[1], px = position[0],
		yt = this.wrapCacheY[py],
		yb = this.wrapCacheY[py+2],
		xl = this.wrapCacheX[px],
		xr = this.wrapCacheX[px+2];

	if(!this.entityMap[xl][yt])
		free[counter++] = [xl, yt];
	if(!this.entityMap[xl][py])
		free[counter++] = [xl, py];
	if(!this.entityMap[xl][yb])
		free[counter++] = [xl, yb];

	if(!this.entityMap[px][yt])
		free[counter++] = [px, yt];
	if(!this.entityMap[px][yb])
		free[counter++] = [px, yb];

	if(!this.entityMap[xr][yt])
		free[counter++] = [xr, yt];
	if(!this.entityMap[xr][yb])
		free[counter++] = [xr, yb];
	if(!this.entityMap[xr][py])
		free[counter++] = [xr, py];

	return (counter)? free[(Math.random() * counter) | 0] : null;

	// var freeX = new Array(8), freeY = new Array(8), counter = 0,
	// 	py = position[1], px = position[0],
	// 	yt = this.wrapCacheY[py],
	// 	yb = this.wrapCacheY[py+2],
	// 	xl = this.wrapCacheX[px],
	// 	xr = this.wrapCacheX[px+2];

	// if(!this.entityMap[xl][yt])
	// 	free[counter++] = [xl, yt];
	// if(!this.entityMap[xl][py])
	// 	free[counter++] = [xl, py];
	// if(!this.entityMap[xl][yb])
	// 	free[counter++] = [xl, yb];

	// if(!this.entityMap[px][yt])
	// 	free[counter++] = [px, yt];
	// if(!this.entityMap[px][yb])
	// 	free[counter++] = [px, yb];

	// if(!this.entityMap[xr][yt])
	// 	free[counter++] = [xr, yt];
	// if(!this.entityMap[xr][yb])
	// 	free[counter++] = [xr, yb];
	// if(!this.entityMap[xr][py])
	// 	free[counter++] = [xr, py];

	// return (counter)? free[(Math.random() * counter) | 0] : null;
}

Wator.GameField.prototype.getType = function(position) {
	var free = [], counter = 0,
		py = position[1], px = position[0],
		yt = this.wrapCacheY[py],
		yb = this.wrapCacheY[py+2],
		xl = this.wrapCacheX[px],
		xr = this.wrapCacheX[px+2];

	if(this.entityMap[xl][py] && !this.entityMap[xl][py].type)
		free[counter++] = [xl, py];
	if(this.entityMap[xl][yt] && !this.entityMap[xl][yt].type)
		free[counter++] = [xl, yt];
	if(this.entityMap[xl][yb] && !this.entityMap[xl][yb].type)
		free[counter++] = [xl, yb];

	if(this.entityMap[px][yb] && !this.entityMap[px][yb].type)
		free[counter++] = [px, yb];
	if(this.entityMap[px][yt] && !this.entityMap[px][yt].type)
		free[counter++] = [px, yt];

	if(this.entityMap[xr][yt] && !this.entityMap[xr][yt].type)
		free[counter++] = [xr, yt];
	if(this.entityMap[xr][yb] && !this.entityMap[xr][yb].type)
		free[counter++] = [xr, yb];
	if(this.entityMap[xr][py] && !this.entityMap[xr][py].type)
		free[counter++] = [xr, py];

	return (counter)? free[(Math.random() * counter) | 0] : null;
}

Wator.GameField.prototype.set = function(entity, position) {
	this.entityMap[entity.position[0]][entity.position[1]] = null;
	entity.position = position;
	this.entityMap[position[0]][position[1]] = entity;
}

Wator.GameField.prototype.clear = function(entity) {
	this.entityMap[entity.position[0]][entity.position[1]] = null;
	this.entityList[entity.index] = null;
	this.freeList.push(entity.index);
}

Wator.Game = function(w, h, initFish, initShark) {

	this.field = new Wator.GameField(w, h);

	this.addRandom(initFish, initShark);

	this.render = new Wator.Renderer(this.field);

}

Wator.Game.prototype.start = function() {
	this.running = true;
	this.loop();
}

Wator.Game.prototype.stop = function() {
	this.running = false;
}

Wator.Game.prototype.loop = function() {
	if(this.running) {
		// console.time("Loop");
		this.render.loop();
		// console.timeEnd("Loop");
		setTimeout(this.loop.bind(this), (100));
	}
}

Wator.Game.prototype.addRandom = function(fish, shark) {
	var addEntity = function(entity, field) {
		var pos;
		while(true) {
			pos = [
				(Math.random() * field.w) | 0,
				(Math.random() * field.h) | 0
			];

			if(!field.entityMap[pos[0]][pos[1]]) {
				entity.position = pos;
				field.add(entity);
				return;
			}
		}
	}

	for(var f = 0; f < fish; f++)
		addEntity(this.field.creatureCache[0].pop(), this.field);

	for(var s = 0; s < shark; s++)
		addEntity(this.field.creatureCache[1].pop(), this.field);
}

Wator.Creature = function(field, type) {
	this.position = [0, 0];
	this.age = 0;
	this.field = field;
	this.type = type;
	this.starve = 0;
	this.index = 0;
	this.breedTime = Wator.const.breedTime[this.type];
	this.starvTime = Wator.const.starvTime;
}

// only returns false if there was no place to breed...
Wator.Creature.prototype.breed = function(free) {
	if(this.age == this.breedTime) {
		this.age = 0;
		var free = this.field.getFree(this.position);
		if(free!=null) {
			//var nc = new Wator.Creature(this.field, this.type);
			var nc = this.field.creatureCache[this.type].pop();
			nc.age = nc.starve = 0;
			nc.position = free;
			this.field.add(nc);
			return true;
		} else {
			return false;
		}
	}
	return true;
}

Wator.Creature.prototype.eat = function() {
	var fish = this.field.getType(this.position);
	if(fish == null) {
		this.starve++;
		return false;
	} else {
		var fc = this.field.entityMap[fish[0]][fish[1]];
		this.field.clear(fc);
		this.field.creatureCache[0].push(fc);
		this.field.set(this, fc.position);
		this.starve = 0;
		return true;
	}
}

Wator.Creature.prototype.update = function() {
	if(this.type && this.starve >= this.starvTime) {
		this.field.clear(this);
		this.field.creatureCache[1].push(this);
		return;
	}

	//this costruct is ugly but saves one 'getFree' if breeding
	//failed.
	if(this.breed()) {
		if(!this.type || !this.eat()) {
			var free = this.field.getFree(this.position);
			if(free) 
				this.field.set(this, free);
		}
	} else {
		if(this.type)
			this.eat();
	}



	this.age++;
}

