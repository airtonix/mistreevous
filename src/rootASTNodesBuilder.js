import Action from './nodes/action'
import Condition from './nodes/condition'
import Flip from './nodes/flip'
import Lotto from './nodes/lotto'
import Repeat from './nodes/repeat'
import Root from './nodes/root'
import Selector from './nodes/selector'
import Sequence from './nodes/sequence'
import Parallel from './nodes/parallel'
import Wait from './nodes/wait'
import While from './decorators/guards/while'
import Until from './decorators/guards/until'
import Entry from './decorators/entry'
import Exit from './decorators/exit'
import Step from './decorators/step'

/**
 * The node decorator factories.
 */
const DecoratorFactories = {
    "WHILE": (condition) => new While(condition),
    "UNTIL": (condition) => new Until(condition),
    "ENTRY": (functionName) => new Entry(functionName),
    "EXIT": (functionName) => new Exit(functionName),
    "STEP": (functionName) => new Step(functionName)
};

/**
 * The AST node factories.
 */
const ASTNodeFactories = {
    "ROOT": () => ({ 
        type: "root",
        decorators: [],
        name: null,
        children: [],
        validate: function (depth) {
            // A root node cannot be the child of another node.
            if (depth > 1) {
                throw "a root node cannot be the child of another node";
            }

            // A root node must have a single child node.
            if (this.children.length !== 1) {
                throw "a root node must have a single child";
            }
        },
        createNodeInstance: function (namedRootNodeProvider, visitedBranches) { 
            return new Root(
                this.decorators,
                this.children[0].createNodeInstance(namedRootNodeProvider, visitedBranches.slice())
            );
        }
    }),
    "BRANCH": () => ({ 
        type: "branch",
        branchName: "",
        validate: function (depth) {},
        createNodeInstance: function (namedRootNodeProvider, visitedBranches) {
            // Try to find the root node with a matching branch name.
            const targetRootNode = namedRootNodeProvider(this.branchName);

            // If we have already visited this branch then we have a circular dependency.
            if (visitedBranches.indexOf(this.branchName) !== -1) {
                throw `circular dependency found in branch node references for branch '${this.branchName}'`;
            }

            // If we have a target root node, then the node instance we want will be the first and only child of the referenced root node.
            if (targetRootNode) {
                return targetRootNode.createNodeInstance(namedRootNodeProvider, visitedBranches.concat(this.branchName)).getChildren()[0];
            } else {
                throw `branch references root node '${this.branchName}' which has not been defined`;
            }
        }
    }),
    "SELECTOR": () => ({
        type: "selector",
        decorators: [],
        children: [],
        validate: function (depth) {
            // A selector node must have at least a single node.
            if (this.children.length < 1) {
                throw "a selector node must have at least a single child";
            }
        },
        createNodeInstance: function (namedRootNodeProvider, visitedBranches) { 
            return new Selector(
                this.decorators,
                this.children.map((child) => child.createNodeInstance(namedRootNodeProvider, visitedBranches.slice()))
            );
        }
    }),
    "SEQUENCE": () => ({
        type: "sequence",
        decorators: [],
        children: [], 
        validate: function (depth) {
            // A sequence node must have at least a single node.
            if (this.children.length < 1) {
                throw "a sequence node must have at least a single child";
            }
        },
        createNodeInstance: function (namedRootNodeProvider, visitedBranches) { 
            return new Sequence(
                this.decorators,
                this.children.map((child) => child.createNodeInstance(namedRootNodeProvider, visitedBranches.slice()))
            );
        }
    }),
    "PARALLEL": () => ({
        type: "parallel",
        decorators: [],
        children: [], 
        validate: function (depth) {
            // A parallel node must have at least a single node.
            if (this.children.length < 1) {
                throw "a parallel node must have at least a single child";
            }
        },
        createNodeInstance: function (namedRootNodeProvider, visitedBranches) { 
            return new Parallel(
                this.decorators,
                this.children.map((child) => child.createNodeInstance(namedRootNodeProvider, visitedBranches.slice()))
            );
        }
    }),
    "LOTTO": () => ({
        type: "lotto",
        decorators: [],
        children: [],
        tickets: [], 
        validate: function (depth) {
            // A lotto node must have at least a single node.
            if (this.children.length < 1) {
                throw "a lotto node must have at least a single child";
            }
        },
        createNodeInstance: function (namedRootNodeProvider, visitedBranches) { 
            return new Lotto(
                this.decorators,
                this.tickets,
                this.children.map((child) => child.createNodeInstance(namedRootNodeProvider, visitedBranches.slice()))
            );
        }
    }),
    "REPEAT": () => ({
        type: "repeat",
        decorators: [],
        iterations: null,
        maximumIterations: null,
        children: [],
        validate: function (depth) {
            // A repeat node must have a single node.
            if (this.children.length !== 1) {
                throw "a repeat node must have a single child";
            }

            // A repeat node must have a positive number of iterations if defined. 
            if (this.iterations !== null && this.iterations < 0) {
                throw "a repeat node must have a positive number of iterations if defined";
            }

            // There is validation to carry out if a longest duration was defined.
            if (this.maximumIterations !== null) {
                // A repeat node must have a positive maximum iterations count if defined. 
                if (this.maximumIterations < 0) {
                    throw "a repeat node must have a positive maximum iterations count if defined";
                }

                // A repeat node must not have an iteration count that exceeds the maximum iteration count.
                if (this.iterations > this.maximumIterations) {
                    throw "a repeat node must not have an iteration count that exceeds the maximum iteration count";
                }
            }
        },
        createNodeInstance: function (namedRootNodeProvider, visitedBranches) { 
            return new Repeat(
                this.decorators,
                this.iterations,
                this.maximumIterations,
                this.children[0].createNodeInstance(namedRootNodeProvider, visitedBranches.slice())
            );
        }
    }),
    "FLIP": () => ({
        type: "flip",
        decorators: [],
        children: [],
        validate: function (depth) {
            // A flip node must have a single node.
            if (this.children.length !== 1) {
                throw "a flip node must have a single child";
            }
        },
        createNodeInstance: function (namedRootNodeProvider, visitedBranches) { 
            return new Flip(
                this.decorators,
                this.children[0].createNodeInstance(namedRootNodeProvider, visitedBranches.slice())
            );
        }
    }),
    "CONDITION": () => ({
        type: "condition",
        decorators: [],
        conditionFunction: "",
        validate: function (depth) {},
        createNodeInstance: function (namedRootNodeProvider, visitedBranches) { 
            return new Condition(
                this.decorators,
                this.conditionFunction
            );
        }
    }),
    "WAIT": () => ({
        type: "wait",
        decorators: [],
        duration: null,
        longestDuration: null,
        validate: function (depth) {
            // A wait node must have a positive duration. 
            if (this.duration < 0) {
                throw "a wait node must have a positive duration";
            }

            // There is validation to carry out if a longest duration was defined.
            if (this.longestDuration) {
                // A wait node must have a positive longest duration. 
                if (this.longestDuration < 0) {
                    throw "a wait node must have a positive longest duration if one is defined";
                }

                // A wait node must not have a duration that exceeds the longest duration.
                if (this.duration > this.longestDuration) {
                    throw "a wait node must not have a shortest duration that exceeds the longest duration";
                }
            }
        },
        createNodeInstance: function (namedRootNodeProvider, visitedBranches) { 
            return new Wait(
                this.decorators,
                this.duration,
                this.longestDuration
            );
        }
    }),
    "ACTION": () => ({
        type: "action",
        decorators: [],
        actionName: "",
        validate: function (depth) {},
        createNodeInstance: function (namedRootNodeProvider, visitedBranches) {
            return new Action(
                this.decorators,
                this.actionName
            );
        }
    })
};


 /**
 * Create an array of root AST nodes based on the remaining tokens.
 * @param tokens The remaining tokens.
 * @returns The base definition AST nodes.
 */
export default function buildRootASTNodes(tokens) {
    // There must be at least 3 tokens for the tree definition to be valid. 'ROOT', '{' and '}'.
    if (tokens.length < 3) {
        throw "invalid token count";
    }

    // We should have a matching number of '{' and '}' tokens. If not, then there are scopes that have not been properly closed.
    if (tokens.filter((token) => token === "{").length !== tokens.filter((token) => token === "}").length) {
        throw "scope character mismatch";
    }

    // Create a stack of node children arrays, starting with a definition scope.
    const stack = [[]];

    // We should keep processing the raw tokens until we run out of them.
    while (tokens.length) {
        // Grab the next token.
        const token = tokens.shift();

        let node;

        // How we create the next AST token depends on the current raw token value.
        switch (token.toUpperCase()) {
            case "ROOT":
                // Create a ROOT AST node.
                node = ASTNodeFactories.ROOT();

                // Push the ROOT node into the current scope.
                stack[stack.length - 1].push(node);

                // We may have a root node name defined as an argument.
                if (tokens[0] === "[") {
                    const rootArguments = getArguments(tokens);

                    // We should have only a single argument that is not an empty string for a root node, which is the root name.
                    if (rootArguments.length === 1 && rootArguments[0] !== "") {
                        // The root  name will be the first and only node argument.
                        node.name = rootArguments[0];
                    } else {
                        throw "expected single root name argument";
                    }
                }

                // Try to pick any decorators off of the token stack.
                node.decorators = getDecorators(tokens);

                popAndCheck(tokens, "{");

                // The new scope is that of the new ROOT nodes children.
                stack.push(node.children);
                break;

            case "BRANCH": 
                // Create a BRANCH AST node.
                node = ASTNodeFactories.BRANCH();

                // Push the BRANCH node into the current scope.
                stack[stack.length - 1].push(node);

                // We must have arguments defined, as we require a branch name argument.
                if (tokens[0] !== "[") {
                    throw "expected single branch name argument";
                } 

                // The branch name will be defined as a node argument.
                const branchArguments = getArguments(tokens);

                // We should have only a single argument that is not an empty string for a branch node, which is the branch name.
                if (branchArguments.length === 1 && branchArguments[0] !== "") {
                    // The branch name will be the first and only node argument.
                    node.branchName = branchArguments[0];
                } else {
                    throw "expected single branch name argument";
                } 
                break;

            case "SELECTOR": 
                // Create a SELECTOR AST node.
                node = ASTNodeFactories.SELECTOR();

                // Push the SELECTOR node into the current scope.
                stack[stack.length-1].push(node);

                // Try to pick any decorators off of the token stack.
                node.decorators = getDecorators(tokens);

                popAndCheck(tokens, "{");

                // The new scope is that of the new SELECTOR nodes children.
                stack.push(node.children);
                break;

            case "SEQUENCE":
                // Create a SEQUENCE AST node.
                node = ASTNodeFactories.SEQUENCE();

                // Push the SEQUENCE node into the current scope.
                stack[stack.length-1].push(node);

                // Try to pick any decorators off of the token stack.
                node.decorators = getDecorators(tokens);

                popAndCheck(tokens, "{");

                // The new scope is that of the new SEQUENCE nodes children.
                stack.push(node.children);
                break;

            case "PARALLEL":
                // Create a PARALLEL AST node.
                node = ASTNodeFactories.PARALLEL();

                // Push the PARALLEL node into the current scope.
                stack[stack.length-1].push(node);

                // Try to pick any decorators off of the token stack.
                node.decorators = getDecorators(tokens);

                popAndCheck(tokens, "{");

                // The new scope is that of the new PARALLEL nodes children.
                stack.push(node.children);
                break;

            case "LOTTO":
                // Create a LOTTO AST node.
                node = ASTNodeFactories.LOTTO();

                // Push the LOTTO node into the current scope.
                stack[stack.length-1].push(node);

                // If the next token is a '[' character then some ticket counts have been defined as arguments.
                if (tokens[0] === "[") {
                    // Get the ticket count arguments, each argument must be a number.
                    node.tickets = getArguments(tokens, (arg) => (!isNaN(arg)) && parseFloat(arg, 10) === parseInt(arg, 10), "lotto node ticket counts must be integer values");
                }

                // Try to pick any decorators off of the token stack.
                node.decorators = getDecorators(tokens);

                popAndCheck(tokens, "{");

                // The new scope is that of the new LOTTO nodes children.
                stack.push(node.children);
                break;

            case "CONDITION": 
                // Create a CONDITION AST node.
                node = ASTNodeFactories.CONDITION();

                // Push the CONDITION node into the current scope.
                stack[stack.length - 1].push(node);

                // We must have arguments defined, as we require a condition function name argument.
                if (tokens[0] !== "[") {
                    throw "expected single condition name argument";
                } 

                // The condition name will be defined as a node argument.
                const conditionArguments = getArguments(tokens);

                // We should have only a single argument that is not an empty string for a condition node, which is the condition function name.
                if (conditionArguments.length === 1 && conditionArguments[0] !== "") {
                    // The condition function name will be the first and only node argument.
                    node.conditionFunction = conditionArguments[0];
                } else {
                    throw "expected single condition name argument";
                }

                // Try to pick any decorators off of the token stack.
                node.decorators = getDecorators(tokens);
                break;

            case "FLIP":
                // Create a FLIP AST node.
                node = ASTNodeFactories.FLIP();

                // Push the Flip node into the current scope.
                stack[stack.length-1].push(node);

                // Try to pick any decorators off of the token stack.
                node.decorators = getDecorators(tokens);

                popAndCheck(tokens, "{");

                // The new scope is that of the new FLIP nodes children.
                stack.push(node.children);
                break;

            case "WAIT":
                // Create a WAIT AST node.
                node = ASTNodeFactories.WAIT();

                // Push the WAIT node into the current scope.
                stack[stack.length-1].push(node);

                // Get the duration and potential longest duration of the wait.
                const durations = getArguments(tokens, (arg) => (!isNaN(arg)) && parseFloat(arg, 10) === parseInt(arg, 10), "wait node durations must be integer values");

                // We should have got one or two durations.
                if (durations.length === 1) {
                    // A static duration was defined.
                    node.duration = parseInt(durations[0], 10);
                } else if (durations.length === 2) {
                    // A shortest and longest duration was defined.
                    node.duration        = parseInt(durations[0], 10);
                    node.longestDuration = parseInt(durations[1], 10);
                } else {
                    // An incorrect number of durations was defined.
                    throw "invalid number of wait node duration arguments defined";
                }

                // Try to pick any decorators off of the token stack.
                node.decorators = getDecorators(tokens);
                break;

            case "REPEAT":
                // Create a REPEAT AST node.
                node = ASTNodeFactories.REPEAT();

                // Push the REPEAT node into the current scope.
                stack[stack.length-1].push(node);

                // Check for iteration counts ([])
                if (tokens[0] === "[") {
                    // An iteration count has been defined. Get the iteration and potential maximum iteration of the wait.
                    const iterationArguments = getArguments(tokens, (arg) => (!isNaN(arg)) && parseFloat(arg, 10) === parseInt(arg, 10), "repeat node iteration counts must be integer values");

                    // We should have got one or two iteration counts.
                    if (iterationArguments.length === 1) {
                        // A static iteration count was defined.
                        node.iterations = parseInt(iterationArguments[0], 10);
                    } else if (iterationArguments.length === 2) {
                        // A minimum and maximum iteration count was defined.
                        node.iterations        = parseInt(iterationArguments[0], 10);
                        node.maximumIterations = parseInt(iterationArguments[1], 10);
                    } else {
                        // An incorrect number of iteration counts was defined.
                        throw "invalid number of repeat node iteration count arguments defined";
                    }
                }

                // Try to pick any decorators off of the token stack.
                node.decorators = getDecorators(tokens);

                popAndCheck(tokens, "{");

                // The new scope is that of the new REPEAT nodes children.
                stack.push(node.children);
                break;

            case "ACTION":
                // Create a ACTION AST node.
                node = ASTNodeFactories.ACTION();

                // Push the ACTION node into the current scope.
                stack[stack.length-1].push(node);

                // We must have arguments defined, as we require an action name argument.
                if (tokens[0] !== "[") {
                    throw "expected single action name argument";
                } 

                // The action name will be defined as a node argument.
                const actionArguments = getArguments(tokens);

                // We should have only a single argument that is not an empty string for an action node, which is the action name.
                if (actionArguments.length === 1 && actionArguments[0] !== "") {
                    // The action name will be the first and only node argument.
                    node.actionName = actionArguments[0];
                } else {
                    throw "expected single action name argument";
                }

                // Try to pick any decorators off of the token stack.
                node.decorators = getDecorators(tokens);
                break;

            case "}": 
                // The '}' character closes the current scope.
                stack.pop();
                break;

            default:
                throw "unexpected token: " + token
        }
    }

    // A function to recursively validate each of the nodes in the AST.
    const validateASTNode = (node, depth) => {
        // Validate the node.
        node.validate(depth);

        // Validate each child of the node.
        (node.children ||[]).forEach((child) => validateASTNode(child, depth + 1));
    };

    // Start node validation from the definition root.
    validateASTNode({ 
        children: stack[0],
        validate: function (depth) {
            // We must have at least one node defined as the definition scope, which should be a root node.
            if (this.children.length === 0) {
                throw "expected root node to have been defined";
            }

            // Each node at the base of the definition scope MUST be a root node.
            for (const definitionLevelNode of this.children) {
                if (definitionLevelNode.type !== "root") {
                    throw "expected root node at base of definition";
                }
            }

            // Exactly one root node must not have a name defined. This will be the main root, others will have to be referenced via branch nodes.
            if (this.children.filter(function (definitionLevelNode) { return definitionLevelNode.name === null; }).length !== 1) {
                throw "expected single unnamed root node at base of definition to act as main root";
            }

            // No two named root nodes can have matching names.
            const rootNodeNames = [];
            for (const definitionLevelNode of this.children) {
                if (rootNodeNames.indexOf(definitionLevelNode.name) !== -1) {
                    throw `multiple root nodes found with duplicate name '${definitionLevelNode.name}'`;
                } else {
                    rootNodeNames.push(definitionLevelNode.name);
                }
            }
        }
    }, 0);

    // Return the root AST nodes.
    return stack[0];
};

/**
 * Pop the next raw token off of the stack and throw an error if it wasn't the expected one.
 * @param tokens The array of remaining tokens.
 * @param expected An optional string that we expect the next popped token to match.
 * @returns The popped token.
 */
function popAndCheck(tokens, expected) {
    // Get and remove the next token.
    const popped = tokens.shift();

    // We were expecting another token.
    if (popped === undefined) {
        throw "unexpected end of definition"; 
    }

    // If an expected token was defined, was it the expected one?
    if (expected && popped.toUpperCase() !== expected.toUpperCase()) {
        throw "unexpected token found on the stack. Expected '" + expected + "' but got '" + popped + "'"; 
    }

    // Return the popped token.
    return popped;
};

/**
 * Pull an argument list off of the token stack.
 * @param tokens The array of remaining tokens.
 * @param argumentValidator The argument validator function.
 * @param validationFailedMessage  The exception message to throw if argument validation fails.
 * @returns The arguments list.
 */
function getArguments(tokens, argumentValidator, validationFailedMessage) {
    // Any lists of arguments will always be wrapped in '[]'. so we are looking for an opening
    popAndCheck(tokens, "[");

    const argumentListTokens = [];
    const argumentList       = [];

    // Grab all tokens between the '[' and ']'.
    while (tokens.length && tokens[0] !== "]") {
        // The next token is part of our arguments list.
        argumentListTokens.push(tokens.shift());
    }

    // Validate the order of the argument tokens. Each token must either be a ',' or a single argument that satisfies the validator.
    argumentListTokens.forEach((token, index) => {
        // Get whether this token should be an actual argument.
        const shouldBeArgumentToken = !(index & 1);

        // If the current token should be an actual argument then validate it,otherwise it should be a ',' token.
        if (shouldBeArgumentToken) {
            // Try to validate the argument.
            if (argumentValidator && !argumentValidator(token)) {
                throw validationFailedMessage;
            }

            // This is a valid argument!
            argumentList.push(token);
        } else {
            // The current token should be a ',' token.
            if (token !== ",") {
                throw `invalid argument list, expected ',' or ']' but got '${token}'`;
            }
        }
    });

    // The arguments list should terminate with a ']' token.
    popAndCheck(tokens, "]");

    // Return the argument list.
    return argumentList;
};

/**
 * Pull any decorators off of the token stack.
 * @param tokens The array of remaining tokens.
 * @returns An array od decorators defined by any directly following tokens.
 */
function getDecorators(tokens) {
	// Create an array to hold any decorators found. 
	const decorators = [];
  
    // Keep track of names of decorators that we have found on the token stack, as we cannot have duplicates.
    const decoratorsFound = [];
  
    // Try to get the decorator factory for the next token.
    let decoratorFactory = DecoratorFactories[(tokens[0] || "").toUpperCase()];

    // Pull decorator tokens off of the tokens stack until we have no more.
    while (decoratorFactory) {
        // Check to make sure that we have not already created a decorator of this type for this node.
        if (decoratorsFound.indexOf(tokens[0]) !== -1) {
            throw `duplicate decorator '${tokens[0].toUpperCase()}' found for node`;
        }

        decoratorsFound.push(tokens[0]);

        // The decorator definition should consist of the tokens 'NAME', '(', 'ARGUMENT' and ')'.
        popAndCheck(tokens, tokens[0].toUpperCase());
        popAndCheck(tokens, "(");
        const decoratorArgument = popAndCheck(tokens);
        popAndCheck(tokens, ")");

        // Create the decorator and add it to the array of decorators found.
        decorators.push(decoratorFactory(decoratorArgument));

        // Try to get the next decorator name token, as there could be multiple.
        decoratorFactory = DecoratorFactories[(tokens[0] || "").toUpperCase()];
    }
  
	return decorators;
};