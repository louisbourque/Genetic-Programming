//postMessage('{"act":"debug","data":"message"}');

/**
This is the worker. It is used by a2.html to perform all the CPU-intensive
processing, so the GUI will remain responsive.
**/
function Node(action){
	this.action = action;
	this.arg1;
	this.arg2;
}


var config;
var runTimeout = 0;
var stop_running = true;
var population;
var run;
var gen;
var fitness_evaluations;
var measure_fitness;
var crossover_function;



//this is the function that is called whenever the worker receives a message.
//based on the content of the message (event.data.act), do the appropriate action.
onmessage = function(event) {
	var message = JSON.parse(event.data);
	switch(message.act){
		case 'pause':
			stop_running = true;
			break;
		case 'init':
			stop_running = false;
			config = message.data;

			run = 0;
			fitness_evaluations = 0;
			runGP();
			break;
	}
}

function runGP(){

	gen = 0;
	//make initial random population
	population = new Array();
	for(var i = 0;i<config.popSize;){
		var object = new Object();
		//call generate_chromosome with half false, half true (for Ramped Half and Half)
		object.chromosome = generate_chromosome(i > config.popSize/2);
		object.fitness = 0;
		if(insert_into_population(object,population))
			i++;
	}
	for(var i = 0;i<population.length;i++){
		population[i].fitness = measure_fitness(population[i].chromosome);
	}
	iterGP();
}

function iterGP(){
	//sort population by fitness
	if(config.fitness_order == "desc")
		population.sort( function (a,b) { return b.fitness-a.fitness });
	else
		population.sort( function (a,b) { return a.fitness-b.fitness });

	//if best solution has a fitness less than 0.001, we can stop
	if(population[population.length-1].fitness < 0.001)
		stop_running = true;

	//termination sat for run?
	if(stop_running || config.maxGenerations == gen){
		run++;
		var message = new Object();
		message.act = "answer";
		message.data = new Object();
		message.data.best = population[population.length-1];
		message.data.fitness_evaluations = fitness_evaluations;
		message.data.gen = gen;
		postMessage(JSON.stringify(message));
		if(!stop_running && run < config.maxRuns){
			runTimeout = setTimeout(runGP, 10);
			return true;
		}
		return true;
	}

	//report best so far
	var message = new Object();
	message.act = "generation";
	message.gen = gen;
	message.data = population[population.length-1];
	postMessage(JSON.stringify(message));

	var newPopulation = new Array();
	for(var i = 0;!stop_running && i<population.length;){
		var rnum = Math.random();
		//10% chance of reproduction, 90% chance of crossover
		if(rnum > 0.9){
			//select one individual based on fitness
			var individual = population[select_from_population()];
			//perform reproduction
			var newIndividual = new Object();
			newIndividual.chromosome = individual.chromosome;
			newIndividual.fitness = individual.fitness;
			//insert copy in new pop
			if(insert_into_population(newIndividual,newPopulation))
				i++;
		}else{
			//select two individuals based on fitness
			var individual1 = population[select_from_population()];
			var individual2 = population[select_from_population()];
			//perform crossover
			var child1 = new Object();
			var child2 = new Object();
			child1.chromosome = crossover_function(individual1.chromosome,individual2.chromosome);
			child2.chromosome = crossover_function(individual1.chromosome,individual2.chromosome);
			child1.fitness = measure_fitness(child1.chromosome);
			child2.fitness = measure_fitness(child2.chromosome);

			var candidates = new Array();
			candidates.push(individual1);
			candidates.push(individual2);
			candidates.push(child1);
			candidates.push(child2);
			if(config.fitness_order == "desc")
				candidates.sort( function (a,b) { return b.fitness-a.fitness });
			else
				candidates.sort( function (a,b) { return a.fitness-b.fitness });
			//insert offspring in new pop
			if(insert_into_population(candidates[2],newPopulation))
				i++;
			if(insert_into_population(candidates[3],newPopulation))
				i++;
		}
	}
	//if newPopulation is shorter than population, then we hit a stop condition. The best solution
	// may be in population, fill new population with the best of population so they are of the same size
	if(newPopulation.length < population.length){
		newPopulation = newPopulation.concat(population.splice(newPopulation.length));
	}
	population = newPopulation;

	gen++;

	runTimeout = setTimeout(iterGP, 5);
}

function crossover_function(parent1, parent2){
	var child = copy_tree(parent1);
	//traverse each tree mapping nodes to arrays. One array for functions, one for terminals
	var child_func_nodes = new Array();
	var child_term_nodes = new Array();
	map_nodes(child,child_func_nodes,child_term_nodes);

	var parent2_func_nodes = new Array();
	var parent2_term_nodes = new Array();
	map_nodes(parent2,parent2_func_nodes,parent2_term_nodes);
	//copy parent1 to a new tree - need to do this so we don't modify the original parent1

	//choose which to crossover on (function or terminal)
	if(Math.random() > 0.9 || child_func_nodes.length == 0)
		var c_crossover_nodes = child_term_nodes;
	else
		var c_crossover_nodes = child_func_nodes;

	if(Math.random() > 0.9 || parent2_func_nodes.length == 0)
		var p2_crossover_nodes = parent2_term_nodes;
	else
		var p2_crossover_nodes = parent2_func_nodes;
	//choose which node to crossover on
	c_crossover_node = c_crossover_nodes[Math.floor(Math.random() * c_crossover_nodes.length)];
	p2_crossover_node = p2_crossover_nodes[Math.floor(Math.random() * p2_crossover_nodes.length)];

	//copy nodes from parent 2, replace in child
	c_crossover_node.action = p2_crossover_node.action;
	c_crossover_node.arg1 = copy_tree(p2_crossover_node.arg1);
	c_crossover_node.arg2 = copy_tree(p2_crossover_node.arg2);

	//prevent bloat by returning a parent instead of the child if the child is too large
	if(depth_of_tree(child) > config.tree_limit_running)
		return parent1;
	return child;

}

function depth_of_tree(node){
	if(typeof(node) == 'undefined') return 0;
	return Math.max(depth_of_tree(node.arg1) + 1, depth_of_tree(node.arg2) + 1);
}

function copy_tree(node){
	if(typeof(node) == 'undefined') return undefined;
	var new_node = new Node(node.action);
	new_node.arg1 = copy_tree(node.arg1);
	new_node.arg2 = copy_tree(node.arg2);
	return new_node;
}

function map_nodes(node,func_nodes,term_nodes){
	if(typeof(node) == 'undefined') return;
	if(config.chromosome_function.indexOf(node.action) >= 0)
		func_nodes[func_nodes.length] = node;
	else
		term_nodes[term_nodes.length] = node;

	map_nodes(node.arg1,func_nodes,term_nodes);
	map_nodes(node.arg2,func_nodes,term_nodes);
}

//check if it's already in the population - checking trees for equality is expensive: allow duplication
function insert_into_population(individual,newPopulation){
	//for(var i=0;i<newPopulation.length;i++){
	//	if(trees_equal(individual.chromosome,newPopulation[i].chromosome))
	//		return false;
	//}
	newPopulation.push(individual);
	return true;
}

//checking trees for equality is expensive
function trees_equal(tree1,tree2){
	if(typeof(tree1) == "undefined" || typeof(tree2) == "undefined")
		return typeof(tree1) == typeof(tree2);
	if(typeof(tree1.action) == "undefined" || typeof(tree2.action) == "undefined")
		return typeof(tree1.action) == typeof(tree2.action);
	return (tree1.action == tree2.action) && trees_equal(tree1.arg1,tree2.arg1) && trees_equal(tree1.arg2,tree2.arg2);
}

function measure_fitness(chromosome){
	fitness_evaluations++;
	var fitness = 0;
	var x = 0;
	for(var i = 0;i<config.target_fitness.length;i++){
		x = config.target_fitness[i][0];
		fitness = fitness + Math.abs(config.target_fitness[i][1] - eval_tree(chromosome,x));
		if(isNaN(fitness)){
			return 999999;
		}
	}
	return fitness;
}

function select_from_population(){
	var choices = new Array();
	for(var i = 0;i<7;i++){
		var rnum = Math.floor(Math.random() * population.length);
		choices[i] = population[rnum];
		choices[i].index = rnum;
	}
	if(config.fitness_order == "desc")
		choices.sort( function (a,b) { return b.fitness-a.fitness });
	else
		choices.sort( function (a,b) { return a.fitness-b.fitness });
	var r = Math.random();
	//p = 0.5
	if(r < 0.5){
		//return most fit
		return choices[choices.length-1].index;
	}
	//otherwise, return a random choice
	var rnum = Math.floor(Math.random() * choices.length);
	return choices[rnum].index;
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

//randomly generate a tree
//this will be called with grow set to false half of the time, true the other half
function generate_chromosome(grow) {
	var randomchromosome = new Node();
	return generate_chromosome_recursive(randomchromosome,config.tree_limit_initial,grow);
}

function generate_chromosome_recursive(node, limit, grow){
	//if grow is true, use Grow Method

	//in both methods, only choose terminals at max depth
	if(limit <= 0){
		var rnum = Math.floor(Math.random() * config.chromosome_terminal.length);
		node.action = config.chromosome_terminal[rnum];
		if(node.action == 'R')
			node.action = Math.ceil(Math.random()*10);
		return node;
	}

	//choose any function or terminal to grow
	if(grow){
		var functerm = config.chromosome_function.concat(config.chromosome_terminal);
		var rnum = Math.floor(Math.random() * functerm.length);
		node.action = functerm[rnum];

		if(rnum >= config.chromosome_function.length){
			//action was a terminal
			if(node.action == 'R')
				node.action = Math.ceil(Math.random()*10);
			return node;
		}
		node.arg1 = generate_chromosome_recursive(new Node(), limit-1);
		node.arg2 = generate_chromosome_recursive(new Node(), limit-1);
		return node;
	}

	//choose any function to grow
	var rnum = Math.floor(Math.random() * config.chromosome_function.length);
	node.action = config.chromosome_function[rnum];

	node.arg1 = generate_chromosome_recursive(new Node(), limit-1);
	node.arg2 = generate_chromosome_recursive(new Node(), limit-1);
	return node;
}
