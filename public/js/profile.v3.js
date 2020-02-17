function getRandomColor() {
    return "#" + (Math.floor(Math.random() * 16777215).toString(16) + '000000')
}

function profile(container, profile) {
    const callTree = {}
    const scriptColor = {}

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
                const id = n.id;
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
                names.add(n.callFrame.functionName + ' ' + n.callFrame.scriptId + ' ' + n.callFrame.lineNumber + ' ' + n.callFrame.columnNumber + ' ' + n.callFrame.url)
            }
        }
    }
    var s = new sigma({
        container: container, 
        settings: {
            maxNodeSize: 20,
            minNodeSize: 3,
            zoomingRatio: 1,
            enableCamera: false
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
}
