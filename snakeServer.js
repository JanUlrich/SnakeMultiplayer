var server = require("./easyHTTPServer/HTTPServer");

var exec = require('child_process').exec,
    child;

//startMidori("http://127.0.0.1:8080");

server.registerFile("game.html", "/");
server.registerFile("lib/jquery-1.9.0.min.js","/lib/jquery-1.9.0.min.js");
var httpServer = server.startHTTP(8080);

var nowjs = require("now");
var everyone = nowjs.initialize(httpServer);

everyone.now.changeSnakeDirection = function(direction){
	//console.log(direction);
    //everyone.now.setDirection(direction);
    for(i=0;i<players.length;i++){
    	if(players[i].clientID === this.user.clientId){
    		if(!players[i].moveDone){
	    		var tempD = players[i].d;
	    		if(direction == "left" && tempD != "right") players[i].d = "left";
				else if(direction == "up" && tempD != "down") players[i].d = "up";
				else if(direction == "right" && tempD != "left") players[i].d = "right";
				else if(direction == "down" && tempD != "up") players[i].d = "down";
	    		players[i].moveDone = true;
	    	}
    	}
    }
}


function startMidori(url){
	child = exec('midori -a '+url+' -e Fullscreen',
	function (error, stdout, stderr) {
		console.log('stdout: ' + stdout);
		console.log('stderr: ' + stderr);
		if (error !== null) {
			console.log('exec error: ' + error);
		}
});
}

//Die Game-Logik:
//Lets create the snake now
	//GLobale Variablen:
	var food; //Position of the Food
	var paint_array; //an array of cells to be painted by clients
	var players = new Array(); //the participating Players

	//static final Variables:
	var gameWidth = 70;
	var gameHeight = 40;
	var tickInterval = 100; //speed of the game


	function init()
	{
		create_food();
		if(typeof game_loop != "undefined") clearInterval(game_loop);
		game_loop = setInterval(game_tick, tickInterval);
	}
	init();
	
	//A Player Joins:
	everyone.connected(function(){
		//var group = nowjs.getGroup(this.user.clientId);
		//group.addUser(this.user.clientId);
		players.push(createPlayer(this.user.clientId));
	});

	//A Player Leaves:
	everyone.disconnected(function(){
		for(i=0;i<players.length;i++){
			if(players[i].clientID=this.user.clientId){
				players.splice(i,1);
			}
		}
	});

	function createPlayer(clientID){
		var newPlayer = {};
		newPlayer.clientID = clientID;
		newPlayer.color = "blue";
		newPlayer.d = "right"; //default direction
		newPlayer.score = 0;
		//var snake_array; //an array of cells to make up the snake
		newPlayer.snake = create_snake();
		//newPlayer.snake = snake_array;
		return newPlayer;
	}

	function create_snake(snakeArray)
	{
		var length = 5; //Length of the snake
		snakeArray = []; //Empty array to start with
		for(var i = length-1; i>=0; i--)
		{
			//This will create a horizontal snake starting from the top left
			snakeArray.push({x: i, y:0});
		}
		return snakeArray;
	}
	
	//Lets create the food now
	function create_food()
	{
		food = {
			x: Math.round(Math.random()*(gameWidth-1)), 
			y: Math.round(Math.random()*(gameHeight-1)), 
		};
		//For debug: console.log("Food created at: "+food.x+", "+food.y);
		//This will create a cell with x/y between 0-44
		//Because there are 45(450/10) positions accross the rows and columns
	}

	function game_tick(){
		paint_array = new Array(); // Reset array

		for(i=0;i<players.length;i++){
			stepPlayer(players[i]); //Do one step for every player
			players[i].moveDone = false;
		}
		//Lets paint the food
		paint_cell(food.x, food.y);

		//Let the Clients paint the new Game-Situation
		if(typeof everyone.now.paintGameArray==="function")everyone.now.paintGameArray(paint_array, gameWidth, gameHeight);
	}

	function paint_cell(x,y,color){
		if(color == undefined) color = "black";
		paint_array.push({"x":x,"y":y,"color":color});
	}

	//Function tells Clients to paint the new state of the game
	function stepPlayer(player){
		var snake_array = player.snake;
		var playerColor = player.color;
		var d = player.d;
		//The movement code for the snake to come here.
		//The logic is simple
		//Pop out the tail cell and place it infront of the head cell
		var nx = player.snake[0].x;
		var ny = snake_array[0].y;
		//These were the position of the head cell.
		//We will increment it to get the new head position
		//Lets add proper direction based movement now
		if(d == "right") nx++;
		else if(d == "left") nx--;
		else if(d == "up") ny--;
		else if(d == "down") ny++;
		
		//Lets add the game over clauses now
		//This will restart the game if the snake hits the wall
		//Lets add the code for body collision
		//Now if the head of the snake bumps into its body, the game will restart
		if(nx <= -1 || nx >= gameWidth || ny <= -1 || ny >= gameHeight || check_collision(nx, ny, snake_array))
		{
			//restart game
			//init();
			player.snake = create_snake();
			//Lets organize the code a bit now.
			return;
		}
		
		//Lets write the code to make the snake eat the food
		//The logic is simple
		//If the new head position matches with that of the food,
		//Create a new head instead of moving the tail
		if(nx == food.x && ny == food.y)
		{
			var tail = {x: nx, y: ny};
			player.score++;
			//Create new food
			create_food();
		}
		else
		{
			var tail = snake_array.pop(); //pops out the last cell
			tail.x = nx; tail.y = ny;
		}
		//The snake can now eat the food.
		
		snake_array.unshift(tail); //puts back the tail as the first cell
		
		for(var i = 0; i < snake_array.length; i++)
		{
			var c = snake_array[i];
			//Lets paint 10px wide cells
			paint_cell(c.x, c.y, playerColor);
		}
		
	}

	function check_collision(x, y, array)
	{
		//This function will check if the provided x/y coordinates exist
		//in an array of cells or not
		for(var i = 0; i < array.length; i++)
		{
			if(array[i].x == x && array[i].y == y)
			 return true;
		}
		return false;
	}