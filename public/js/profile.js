const separation = 3
const callTree = {}
let d = null
let w = null
let level = 0
let widths = null
const idSet = new Set()
const nbCall = {}
$(document).ready(() => {
    $.get('Profile.json', profile => {
        let count = 0
        const names = new Set()
        for (let action of profile) {
            if (action.args.data && action.args.data.cpuProfile && action.args.data.cpuProfile.nodes) {
                for (let n of action.args.data.cpuProfile.nodes) {
                    if (n.callFrame.url && n.callFrame.url.indexOf("chrome-extension://") > -1) {
                        break;
                    }
                    const id = n.id;
                    nbCall[id] = (nbCall[id] || 0) + 1
                    if (idSet.has(id)) {
                        console.log(n, action, callTree[id])
                        continue;
                    }
                    idSet.add(id);
                    if (callTree[id]) {
                        const children = callTree[id].children;
                        callTree[id] = n
                        callTree[id].children = (children || new Set())
                    } else {
                        callTree[id] = n
                        callTree[id].children = new Set()
                    }
                    if (n.parent) {
                        if (!callTree[n.parent]) {
                            callTree[n.parent] = {}
                            callTree[n.parent].children = new Set()
                        }
                        callTree[n.parent].children.add(id);
                    }
                    count+=1
                    names.add(n.callFrame.functionName + ' ' + n.callFrame.scriptId + ' ' + n.callFrame.lineNumber + ' ' + n.callFrame.columnNumber + ' ' + n.callFrame.url)
                }
            }
        }
        console.log(Object.keys(callTree).length, names.size)
        d = depth(callTree)
        w = (document.body.clientWidth)/(separation*d)
        widths = []
        computeWidth(callTree[1], widths, 0)
    })
})
console.log(nbCall)

function setup() {
    createCanvas(document.body.clientWidth, document.body.clientHeight);
}

function depth(callTree) {
    let maxDepth = 0
    for (let id in callTree) {
        if (callTree[id].parent) {
            let depth = 1
            let currentId = callTree[id].parent
            while (callTree[currentId].parent) {
                depth+=1
                currentId = callTree[currentId].parent
            }
            maxDepth = Math.max(maxDepth, depth)
        }
    }
    return maxDepth;
}
function draw() {
    if (callTree[1]) {
        level = 0
        drawLevel(callTree[1], w, level, widths, []);
    }
}

function computeWidth(tree, arr, i) {
    if (!arr[i]) {
        arr[i] = 0
    }
    arr[i]++;
    for(let childId of tree.children) {
        computeWidth(callTree[childId], arr, i + 1);
    }
}


function drawLevel(tree, width, level, widths, pop) {
    if (!pop[level]) {
        pop[level] = 0
    }
    
    const x = level * width * separation;
    const h = float(document.body.clientHeight) / (widths[level]);
    const y = Math.round(float(pop[level]) * h);

    pop[level]++;
    stroke("#DDD")
    for (let child of tree.children) {
        strokeWeight(2);
        const h2 = document.body.clientHeight / widths[level + 1];
        const tempPop = (pop[level + 1] || 0)
        line(x + 10, y + (h / 2) + 5, x + separation * width, h2 * tempPop + (h2 / 2)+5);
        drawLevel(callTree[child], width, level + 1, widths, pop);
    }
    if (!tree.color) {
        tree.color = getRandomColor()
    }
    strokeWeight(0);
    fill(tree.color);
    rect(x, y+h/2,10,10);
}
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}