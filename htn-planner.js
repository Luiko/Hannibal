/*jslint bitwise: true, browser: true, todo: true, evil:true, devel: true, debug: true, nomen: true, plusplus: true, sloppy: true, vars: true, white: true, indent: 2 */
/*globals Engine, HANNIBAL, H, deb */

/*--------------- P L A N N E R -----------------------------------------------

  Simple HTN Planner based on Pyhop/SHOP written by Dana S. Nau
  https://bitbucket.org/dananau/pyhop
  http://www.cs.umd.edu/projects/shop/

  tested with 0 A.D. Alpha 15 Osiris
  V: 0.1, agentx, CGN, Feb, 2014

*/

HANNIBAL = (function(H){

  var maxIterate = 100,
      maxDepth   = 0,
      cntIterate = 0,

      // Planner functions
      methods    = {},
      operators  = {},

      // helper
      prit = H.prettify,
      mul  = function(n){return new Array(n || 2).join(" ");},
      copy = function(o){return JSON.parse(JSON.stringify(o));},
      tab  = function (s,l){return H.replace(H.tab(s,l), " ", "&nbsp;");};


  function logState(state, indent){
    if (state){
      deb("   HTN: state: %s, %s state: %s", state.name, mul(indent), prit(state));
    } else {deb("   HTN: False");}
  }

  function logGoal(goal, indent){
    if (goal){
      deb("   HTN: goal: %s, %s state: %s", goal.name, mul(indent), prit(goal));
    } else {deb("   HTN: False");}
  }

  function addOperator(name, operator){
    operators[name] = operator;
  }

  function addMethods(name, method){
    methods[name] = method;
  }

  // function addMethods(name /* functions */){
  //   methods[name] = H.toArray(arguments).slice(1);
  // }

  function Goal(name, json){
    this.name = name;
    H.extend(this, json || {});
  }

  function State(name, json){
    this.name = name;
    H.extend(this, json || {});
  }

  function pritObj(o, depth){

    depth = depth || 0;

    var html = "";

    H.each(o, function(k, v){

      var akku = [];

      if (k === 'ress') {
        H.each(v, function(k, v){
          akku.push(k + ": " + v);
        });
        html += "<tr><td>&nbsp;&nbsp;ress: { " + akku.join(", ") + " }</td></tr>";

      } else if (k === 'tech') {
        html += "<tr><td>&nbsp;&nbsp;" + k + ": [</td></tr>";
        html += pritObj(v, depth +2);
        html += "<tr><td>&nbsp;&nbsp;]</td></tr>";

      } else if (typeof v === 'object'){
        html += "<tr><td>&nbsp;&nbsp;" + k + ": {</td></tr>";
        html += pritObj(v, depth +2);
        html += "<tr><td>&nbsp;&nbsp;}</td></tr>";

      } else if (k === 'name') {
        // do nothing
      } else {
        html += "<tr><td>&nbsp;&nbsp;" + H.mulString("&nbsp;", depth) + k + ": " + v + "</td></tr>";
      }

    });

    return html + "<tr></tr>";

  }

  H.HTN = H.HTN || {};

  H.extend(H.HTN, {
    logState:    logState,
    logGoal:     logGoal,
    pritObj:     pritObj,
    methods:     methods,
    operators:   operators,
    addOperator: addOperator,
    addMethods:  addMethods,
    Goal:        Goal,
    State:       State,    
    depth:       function(){return maxDepth;},
    iterations:  function(){return cntIterate;}
  });

  H.HTN.Planner = H.HTN.Planner || {};

  H.extend(H.HTN.Planner, {
    logStart:    function(state, tasks, verbose){
      deb("   HTN:    name: %s, verbose: %s", state.name, verbose);
      deb("   HTN:   tasks: %s", prit(tasks));
      deb("   HTN:   state: %s", prit(state));
    },
    logFinish:   function(plan, state, msecs){
      deb();
      if (Array.isArray(plan) && plan.length > 0){
        deb("<b>   HTN:  SUCCESS actions: %s, %s msecs</b>", plan.length, msecs);
        plan.forEach(function(action, i){

          deb("&nbsp;&nbsp;op: %s, <b style='color: #444'>%s</b> ( %s )", tab(i+1, 3), action[0], action.slice(1).join(", "));

        });
        deb();
        deb("<b>   HTN:   new state:</b>");
        deb(pritObj(state));
        deb();
      } else {
        deb();
        deb("<b>   HTN:  FAILURE plan: [], %s msecs</b>", plan, msecs); 
        deb();
        deb("<b>   HTN:  state: %s</b>", pritObj(state));
        deb();
      }

    },
    plan:        function(state, tasks, verbose){

      var self = H.HTN.Planner, result, newState, t0 = 0, t1 = 0;

      verbose = verbose || 0;

      if (verbose > 0){self.logStart(state, tasks, verbose);}
      
      cntIterate = 0;
      
      t0 = Date.now();
      [result, newState] = self.seekPlan(state, tasks, [], 0, verbose);
      t1 = Date.now();

      if ((document && verbose > -1) || verbose > 0){
        self.logFinish(result, newState,  t1 - t0);
      }

      return result;

    },
    seekPlan: function seekPlan (state, tasks, plan, depth, verbose){

      var self = H.HTN.Planner, task1, solution;

      verbose = verbose || 0;
      maxDepth = (depth > maxDepth) ? depth : maxDepth;

      if (cntIterate > maxIterate){
        tasks = [];
        deb("   HTN:   FAILED, too much iterations");
      }

      if (verbose > 1){deb("   HTN:   D:%s, tasks: %s", depth, prit(tasks));}

      if (tasks.length === 0){
        if (verbose > 2){deb("   HTN:   D:%s, plan: %s", depth, prit(plan));}
        return [plan, state];
      }

      task1 = tasks[0];

      if (operators[task1[0]] !== undefined){

        if (verbose > 2){deb("   HTN:   D:%s, operator: %s", depth, prit(task1));}

        solution = self.seekOperator(tasks, state, plan, depth, verbose);

        if (verbose > 2){deb("   HTN: D:%s, [task] solution: %s", depth, prit(solution));}

        if (solution !== null){
          return solution;
        }


      }


      if (methods[task1[0]] !== undefined){

        if (verbose > 2){deb("   HTN:   D:%s, method: %s", depth, prit(task1));}

        solution = self.seekMethod(tasks, state, plan, depth, verbose);

        if (verbose > 2){deb("   HTN: D:%s, [meth] solution: %s", depth, prit(solution));}

        if (solution !== null){
          return solution;
        }

      }

      if (task1 === "ANY") {


        if (verbose > 2){deb("   HTN:   D:%s, ANY with %s tasks", depth, tasks[1].length);}

        solution = self.seekAnyMethod(tasks, state, plan, depth, verbose);
        if (solution !== null){
          return solution;
        }

        if (verbose > 2){deb("   HTN: D:%s, [ANY] solution: %s", depth, prit(solution));}

      } 


      if (verbose > 2){deb("   HTN:   D:%s, fails on task: %s", depth, task1);}

      if (depth === 0){
        return [plan, state];
      } else {
        return null;
      }

    },
    seekAnyMethod: function(tasks, state, plan, depth, verbose){

      var self        = H.HTN.Planner,
          anyTasks    = tasks[1],
          anyPointer  = 0,
          anyTask     = anyTasks[anyPointer],
          method, params, subtasks, newTasks, solution = null;

      while (anyTask) {

        // relevant = methods[anyTask[0]];
        // for (method of relevant){

          cntIterate += 1;
  
          method   = methods[anyTask[0]];
          params   = [state].concat(anyTask.slice(1));
          subtasks = method.apply(null, params);

          if (verbose > 2){deb("   HTN:   D:%s, ANY subtasks: %s => %s", depth, params, subtasks);}
          
          if(subtasks !== null){

            if (subtasks[0] === "ANY"){

              // TODO: make unique
              subtasks.slice(1)[0].forEach(function(task){
                anyTasks.push(task);
              });

            } else {
              newTasks = subtasks.concat(tasks.slice(2));
              solution = self.seekPlan(state, newTasks, plan, depth +1, verbose);
              // if (verbose > 2){deb("   HTN: D:%s, [ANY] solution: %s", depth, prit(solution));}
              if (solution !== null){
                return solution;
              }

            }
          }    

          anyPointer += 1;
          anyTask = anyTasks[anyPointer];

        // }
      }

      return null;


    },
    seekMethod: function(tasks, state, plan, depth, verbose){

      var self      = H.HTN.Planner,
          solution  = null,
          task1     = tasks[0],
          method    = methods[task1[0]],
          params    = [state].concat(task1.slice(1)),
          subtasks  = method.apply(null, params),
          newTasks;

      cntIterate += 1;
        
      if (verbose > 2){deb("   HTN:   D:%s, subtasks: %s", depth, prit(subtasks));}

      if(subtasks !== null){

        newTasks = subtasks.concat(tasks.slice(1));
        solution = self.seekPlan(state, newTasks, plan, depth +1, verbose);

        if (verbose > 2){deb("   HTN: D:%s, [meth] solution: %s", depth, prit(solution));}

        if (solution !== null){
          return solution;
        }

      }

      return null;

    },
    seekOperator: function(tasks, state, plan, depth, verbose){

      var self      = H.HTN.Planner, 
          solution  = null,
          task1     = tasks[0],
          operator  = operators[task1[0]],
          params    = [copy(state)].concat(task1.slice(1)),
          newState  = operator.apply(null, params);

      if (verbose > 2){deb("   HTN: D:%s, state: %s", depth, prit(newState));}

      cntIterate += 1;

      if (newState){
        solution = self.seekPlan(newState, tasks.slice(1), plan.concat([task1]), depth +1, verbose);
      }
      
      return solution;
    }

  });


return H; }(HANNIBAL));

/*

This is the algorithm, as described by Nau et al.:

procedure SHOP(s,T,D)
   P = the empty plan
   T0 = {member(t,T) : no other task in T is constrained to precede t}
   loop
      if ( T == {} ) then return P
      nondeterministically choose any t such that member(t,T0)
      if t is a primitive task then
         A = {(a,theta) : a is a ground instance of an operator in D, 
                          theta is a substitution that unifies {head(a), t}, and 
                          s satisfies a's preconditions}
         if ( A == {} ) then return failure
         nondeterministically choose a pair (a, theta) such that member((a, theta),A)
         modify s by deleting deletions(a) and adding additions(a)
         append a to P
         modify T by removing t and applying theta
         T0 = {member(t,T) : no other task in T is constrained to precede t}
      else
         M = {(m, theta) : m is an instance of a method in D, 
                           theta unifies {head(m), t},
                           s satisfies m's preconditions, and 
                           m and theta are as general as possible}
        if ( M == {} ) then return failure
        nondeterministically choose a pair (m, theta) such that member((m, theta),M)
        modify T by 
           removing t, adding subtasks(m), constraining each subtask
           to precede the tasks that t preceded, and applying theta
        if ( subtasks(m) != {} ) then
           T0 = {member(t,subtasks(m)) : no other task in T is constrained to precede t}
        else
           T0 = {member(t,T) : no other task in T is constrained to precede t}
    repeat
 end SHOP
 

*/  