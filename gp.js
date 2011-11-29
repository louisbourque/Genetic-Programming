var ctx;
var running = false;
//config object used to set the parameters of the game. This object is passed to the worker thread to initialize it
var config = new Object();
config.fitness_alg = '';
config.popSize = 4000;
config.maxGenerations = 51;
config.maxRuns = 1;
config.mutateProb = 0.02;
config.selection = "tournament";
config.fitness_order = "desc";
config.chromosome_function = ['+','-','*','/','sin','cos','exp'];
config.chromosome_terminal = ['x','R'];
config.maxFitnessEvals = 20000;
config.tree_limit_initial = 6;
config.tree_limit_running = 17;
var worker;


function init(){
	ctx = document.getElementById('canvas').getContext("2d");
	worker = new Worker("gp-worker.js");
	worker.onerror = function(error) {	
		console.log(error.message);
	};
}

//start the run loop
function A_init(){
	if(running) return;
	running = true;
	config.fitness_alg = "A";
	$('#result').empty();
	
	worker.onmessage = function(event) {
		handle_worker_message_A(event.data);
	};
	var message = new Object();
	message.act = "init";
	message.data = config;
	worker.postMessage(JSON.stringify(message));
}
function B_init(){
	if(running) return;
	running = true;
	config.fitness_alg = "B";
	$('#result').empty();
	
	worker.onmessage = function(event) {
		handle_worker_message_B(event.data);
	};
	var message = new Object();
	message.act = "init";
	message.data = config;
	worker.postMessage(JSON.stringify(message));
}

function handle_worker_message_A(data){
	var resultObj = JSON.parse(data);
	if(resultObj.act == "debug"){
		$('#result').prepend(resultObj.data+"<br>");
		return false;
	}
	if(resultObj.act == "generation"){
		$('#result').prepend("Best function of Generation "+resultObj.gen+": "+chromosome_to_string(resultObj.data.chromosome)+" fitness:<strong>("+resultObj.data.fitness+")<\/strong><br>");
		draw_function(resultObj.data.chromosome);
		return true;
	}
	if(resultObj.act == "answer"){
		$('#result').prepend("Answer: <strong>"+chromosome_to_string(resultObj.data.best.chromosome)+"<\/strong><br>With a fitness of <strong>"+resultObj.data.best.fitness+"<\/strong><br>Performed <strong>"+resultObj.data.fitness_evaluations+"<\/strong> fitness evaluations in <strong>"+resultObj.data.gen+"<\/strong> generations.<br>");
		draw_function(resultObj.data.best.chromosome);
		running = false;
		return true;
	}
}


function handle_worker_message_B(data){
	var resultObj = JSON.parse(data);
	if(resultObj.act == "debug"){
		$('#result').prepend(resultObj.data+"<br>");
		return false;
	}
	if(resultObj.act == "generation"){
		$('#result').prepend("Best function of Generation "+resultObj.gen+": "+chromosome_to_string(resultObj.data.chromosome)+" fitness:<strong>("+resultObj.data.fitness+")<\/strong><br>");
		draw_function(resultObj.data.chromosome);
		return true;
	}
	if(resultObj.act == "answer"){
		$('#result').prepend("Answer: <strong>"+chromosome_to_string(resultObj.data.best.chromosome)+"<\/strong><br>With a fitness of <strong>"+resultObj.data.best.fitness+"<\/strong><br>Performed <strong>"+resultObj.data.fitness_evaluations+"<\/strong> fitness evaluations in <strong>"+resultObj.data.gen+"<\/strong> generations.<br>");
		draw_function(resultObj.data.best.chromosome);
		running = false;
		return true;
	}
}

function chromosome_to_string(chromosome){
	if(typeof(chromosome) == 'undefined') return '';
	if(typeof(chromosome.action) == 'undefined') return '';
	if(typeof(chromosome.action) == 'number')
		return chromosome.action;
	if(typeof(chromosome.action) == 'string')
	switch(chromosome.action){
		case 'x':
			return 'x';
		case '+':
		case '-':
		case '*':
		case '/':
			return '('+chromosome_to_string(chromosome.arg1)+' '+chromosome.action+' '+chromosome_to_string(chromosome.arg2)+')';
		case 'sin':
			return 'sin('+chromosome_to_string(chromosome.arg1) +')';
		case 'cos':
			return 'cos('+chromosome_to_string(chromosome.arg1) +')';
		case 'exp':
			return 'exp('+chromosome_to_string(chromosome.arg1) +','+chromosome_to_string(chromosome.arg2)+')';
	}
}

//pause the game
function stop(){
	var message = new Object();
	message.act = "pause";
	worker.postMessage(JSON.stringify(message));
	running = false;
}

function draw_function(function_tree){
	ctx.clearRect(0, 0, 400, 400);
	ctx.fillStyle = "#000";
	ctx.strokeStyle = "#000";
	//draw origin
	ctx.beginPath();
	ctx.moveTo(0,200);
	ctx.lineTo(400,200);
	ctx.moveTo(200,0);
	ctx.lineTo(200,400);
	ctx.moveTo(240,200);
	ctx.lineTo(240,205);
	ctx.moveTo(280,200);
	ctx.lineTo(280,205);
	ctx.moveTo(320,200);
	ctx.lineTo(320,205);
	ctx.moveTo(360,200);
	ctx.lineTo(360,205);
	ctx.moveTo(400,200);
	ctx.lineTo(400,205);
	
	ctx.moveTo(160,200);
	ctx.lineTo(160,205);
	ctx.moveTo(120,200);
	ctx.lineTo(120,205);
	ctx.moveTo(80,200);
	ctx.lineTo(80,205);
	ctx.moveTo(40,200);
	ctx.lineTo(40,205);
	ctx.moveTo(0,200);
	ctx.lineTo(0,205);
	
	ctx.moveTo(200,240);
	ctx.lineTo(195,240);
	ctx.moveTo(200,280);
	ctx.lineTo(195,280);
	ctx.moveTo(200,320);
	ctx.lineTo(195,320);
	ctx.moveTo(200,360);
	ctx.lineTo(195,360);
	ctx.moveTo(200,400);
	ctx.lineTo(195,400);
	
	ctx.moveTo(200,160);
	ctx.lineTo(195,160);
	ctx.moveTo(200,120);
	ctx.lineTo(195,120);
	ctx.moveTo(200,80);
	ctx.lineTo(195,80);
	ctx.moveTo(200,40);
	ctx.lineTo(195,40);
	ctx.moveTo(200,0);
	ctx.lineTo(195,0);
	ctx.stroke();
	ctx.strokeText('x',390,210);
	ctx.strokeText('y',190,10);
	ctx.strokeText('0',190,210);
	ctx.strokeText('1',235,220);
	ctx.strokeText('1',180,165);
	ctx.strokeText('-1',155,220);
	ctx.strokeText('-1',180,245);
	ctx.strokeText('2',275,220);
	ctx.strokeText('2',180,125);
	ctx.strokeText('-2',115,220);
	ctx.strokeText('-2',180,285);
	ctx.strokeText('3',315,220);
	ctx.strokeText('3',180,85);
	ctx.strokeText('-3',75,220);
	ctx.strokeText('-3',180,325);
	ctx.strokeText('4',355,220);
	ctx.strokeText('4',180,45);
	ctx.strokeText('-4',35,220);
	ctx.strokeText('-4',180,365);
	ctx.strokeText('5',390,220);
	ctx.strokeText('5',180,10);
	ctx.strokeText('-5',5,220);
	ctx.strokeText('-5',180,395);
	
	//x = 200 + x*40
	//y = 200 - y*40

	ctx.beginPath();
	ctx.moveTo(0,calc_func(-5.0));
	for(var x = -5.0;x<=5;x = x+1/40){
		ctx.lineTo(200 + x*40,200 - calc_func(x)*40);
	}
	ctx.stroke();
	
	ctx.beginPath();
	ctx.moveTo(0,eval_tree(function_tree,-5.0));
	for(var x = -5.0;x<=5;x = x+1/40){
		ctx.lineTo(200 + x*40,200 - eval_tree(function_tree,x)*40);
	}
	ctx.strokeStyle = '#0F0';
	ctx.stroke();
}

function eval_tree(tree,x){
	if(typeof(tree) == 'undefined') return 0;
	if(typeof(tree.action) == 'number')
		return tree.action;
	if(typeof(tree.action) == 'string'){
		switch(tree.action){
			case 'x':
				return x;
			case '+':
				return eval_tree(tree.arg1,x) + eval_tree(tree.arg2,x);
			case '-':
				return eval_tree(tree.arg1,x) - eval_tree(tree.arg2,x);
			case '*':
				return eval_tree(tree.arg1,x) * eval_tree(tree.arg2,x);
			case '/':
				return eval_tree(tree.arg1,x) / eval_tree(tree.arg2,x);
			case 'sin':
				return Math.sin(eval_tree(tree.arg1,x));
			case 'cos':
				return Math.cos(eval_tree(tree.arg1,x));
			case 'exp':
				return Math.pow(eval_tree(tree.arg1,x),eval_tree(tree.arg2,x));
		}
	}
	return 0;
}

function calc_func(x){
	if(config.fitness_alg == 'A'){
		return 3 * Math.pow(x,3) + 2*Math.pow(x,2) + x + 1;
	}
	if(config.fitness_alg == 'B'){
		return Math.cos(x) + 3*Math.sin(Math.pow(x,2));
		
	}
	return Math.cos(x) + 3*Math.sin(Math.pow(x,2));
}