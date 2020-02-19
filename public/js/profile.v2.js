const separation = 3
const callTree = {}
const executionScope = {}
let d = null
let w = null
let level = 0
let widths = null
const idSet = new Set()
const nbCall = {}
const scriptColor = {}

function getRandomColor() {
    return "#" + (Math.floor(Math.random() * 16777215).toString(16) + '000000')
}

$(document).ready(() => {
    $.get('Profile2.json', profile => {
        let count = 0
        const names = new Set()
        for (let action of profile) {
            if (action.args.data && action.args.data.cpuProfile && action.args.data.cpuProfile.nodes) {
                for (let n of action.args.data.cpuProfile.nodes) {
                    executionScope[n.id] = n
                    if (n.callFrame.url && n.callFrame.url.indexOf("chrome-extension://") > -1) {
                        continue;
                    }
                    if (!scriptColor[n.callFrame.scriptId]) {
                        scriptColor[n.callFrame.scriptId] = getRandomColor()
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
        var s = new sigma({
            container: document.body, 
            settings: {
                maxNodeSize: 20,
                minNodeSize: 3,
                zoomingRatio: 1,
                enableCamera: false,
                labelThreshold: 1000
            }
        });
        for (let nodeID in callTree) {
            let color = getRandomColor()
            if (callTree[nodeID].callFrame) {
                color = scriptColor[callTree[nodeID].callFrame.scriptId]
            }
            let name = ''
            if (callTree[nodeID].callFrame) {
                name = callTree[nodeID].callFrame.functionName
            }
            if (name == '') {
                name = '(anonymous)'
            }
            let scriptId = 0
            if (callTree[nodeID].callFrame) {
                scriptId = callTree[nodeID].callFrame.scriptId
            }
            if (scriptId == 0) {
                scriptId = 1
            }
            s.graph.addNode({id: 'n'+nodeID,
                label: name,
                // Display attributes:
                x: Math.random()*document.body.clientWidth + scriptId,
                y: Math.random()*document.body.clientHeight + scriptId,
                size: 10 + (2*callTree[nodeID].children.size),
                color: color
            })
        }
        for (let nodeID in callTree) {
            for (let childrenId of callTree[nodeID].children) {
                // console.log(nodeID, childrenId)
                s.graph.addEdge({
                    id: 'e' + nodeID + '' + childrenId,
                    source: 'n' + nodeID,
                    target: 'n' + childrenId,
                    color: '#ccc'
                });
            }
        }
        s.refresh();
        // s.startNoverlap();
        s.configForceAtlas2({
            // linLogMode: true,
            // adjustSizes: true,
            scalingRatio: 150,
            slowDown: 50,
            gravity: 0
        });
        document.body.onclick = () => {
            console.log("stop")
            s.killForceAtlas2()
        }
        setTimeout(() => {
            s.startForceAtlas2();
            window.setTimeout(function() {s.killForceAtlas2()}, 25000);
        }, 1000)
    })
})
console.log(nbCall)
