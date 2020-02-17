function getRandomColor() {
    return "#" + (Math.floor(Math.random() * 16777215).toString(16) + '000000')
}

function profile(container, profile) {
    container.innerHTML = ''
    const callTree = {}
    const allAction = {}
    const scriptColor = {}

    function getId(n) {
        return n.callFrame.functionName + ' ' + n.callFrame.scriptId + ' ' + n.callFrame.lineNumber + ' ' + n.callFrame.columnNumber + ' ' + n.callFrame.url;
    }
    const names = new Set()
    for (let action of profile) {
        if (action.args.data && action.args.data.cpuProfile && action.args.data.cpuProfile.nodes) {
            for (let n of action.args.data.cpuProfile.nodes) {
                if (n.callFrame.url && n.callFrame.url.indexOf("chrome-extension://") > -1) {
                    continue;
                }
                if (!scriptColor[n.callFrame.scriptId]) {
                    scriptColor[n.callFrame.scriptId] = getRandomColor()
                }
                const id = getId(n)
                allAction[n.id] = n 

                if (callTree[id]) {
                    const children = callTree[id].children;
                    callTree[id] = n.callFrame
                    callTree[id].children = (children || new Set())
                } else {
                    callTree[id] = n.callFrame
                    callTree[id].children = new Set()
                }
                if (n.parent) {
                    const parentId = getId(allAction[n.parent])
                    if (!callTree[parentId]) {
                        callTree[parentId] = {}
                        callTree[parentId].children = new Set()
                    }
                    callTree[parentId].children.add(id);
                }
                names.add(id)
            }
        }
    }
    console.log(callTree)
    var s = new sigma({
        container: container, 
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
        if (callTree[nodeID]) {
            color = scriptColor[callTree[nodeID].scriptId]
        }
        let name = ''
        if (callTree[nodeID]) {
            name = callTree[nodeID].functionName
        }
        if (name == '') {
            name = '(anonymous)'
        }
        s.graph.addNode({id: 'n'+nodeID,
            label: name,
            // Display attributes:
            x: Math.round(Math.random() * container.clientWidth),
            y: Math.round(Math.random() * container.clientHeight),
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
    s.configForceAtlas2({
        // linLogMode: true,
        // adjustSizes: true,
        scalingRatio: 150,
        slowDown: 50,
        gravity: 0
    });
    setTimeout(() => {
        s.startForceAtlas2();
        window.setTimeout(function() {s.killForceAtlas2()}, 60000);
    }, 100)
}
