const ws = new WebSocket('wss://castor.durieux.me')

let particleMap = {}
let requestMap = {}
let traceMap = {}
let coverageMap = {}
let requests = []

function getRandomColor() {
    return "#" + (Math.floor(Math.random() * 16777215).toString(16) + '000000').substring(0, 6)
}
window.submit = function() {
    const url = document.getElementById("url");
    initMap();
    const scripts = document.getElementById('scripts')
    scripts.innerHTML = ''
    requests = []
    requestMap = {}
    traceMap = {}
    coverageMap = {}
    particleMap = {}
    particles = []
    totalSize = 0
    statRequest = {}
    statCountries = {}
    document.querySelector('.nbRequest .value').innerText = 0
    ws.send(url.value);
    return false;
}

function getRequestType(r) {
    if (r.type == "text/css" || r.type.indexOf('font') != -1) {
        return 'style';
    }
    if (r.type.indexOf('image') != -1) {
        return 'image';
    }
    if (r.type.indexOf('javascript') != -1) {
        return 'script';
    }
    if (r.type.indexOf('json') != -1) {
        return 'data';
    }
    if (r.type.indexOf('html') != -1) {
        return 'content';
    }
    return r.type;
}
function colorType(type, alpha) {
    if (alpha == null) {
        alpha = 0.3;
    }
    if (type == 'content') {
        return 'rgba(78, 72, 0, ' + alpha + ')'
    }
    if (type == 'data') {
        return 'rgba(0, 0, 0, ' + alpha + ')'
    }
    if (type == 'style') {
        return 'rgba(169, 70, 175, ' + alpha + ')'
    }
    if (type == 'image') {
        return 'rgba(101, 181, 41, ' + alpha + ')'
    }
    if (type == 'script') {
        return 'rgba(72, 70, 175, ' + alpha + ')'
    }
    return 'rgba(0, 0, 0, ' + alpha + ')'
}
function renderRequests() {
    const c = document.getElementById('requests')
    c.width = c.clientWidth;
    c.height = c.clientHeight;

    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);

    let totalSize = 0
    for (let r of requests) {
        totalSize += r.length;
    }
    const maxSize = c.clientHeight;
    const minSize = 25
    // let bin = new Bin(c.width, c.height);
    // let boxes = []
    // for (let r of requests) {
    //     const size = maxSize * (r.length / totalSize)
    //     boxes.push(new Box(size, size))
    // }
    // let packer = new Packer([bin]);
    // let packedBoxes = packer.pack(boxes);

    for (let r of requests) {
        console.log()
        ctx.beginPath();
        if (true || r.size == null) {
            r.size = maxSize * (r.length / totalSize)
            if (r.size < minSize) {
                r.size = minSize //+ (Math.random() * 10 - 5);
            }
        }
        if (r.x == null) {
            r.x = c.width * Math.random()
            r.y = c.height * Math.random()
        }
        r.y = r.y + (Math.random() * 2 - 1)
        r.x = r.x + (Math.random() * 2 - 1)
        ctx.arc(r.x, r.y, r.size, 0, 2 * Math.PI);
        ctx.fillStyle = colorType(getRequestType(r));
        ctx.fill();

        if (coverageMap[r.url]) {
            let lUsedBytes = 0
            for (const range of coverageMap[r.url].ranges) {
                lUsedBytes += range.end - range.start - 1;
            }
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.size * (lUsedBytes / coverageMap[r.url].text.length), 0, 2 * Math.PI);
            ctx.fillStyle = colorType(getRequestType(r), 0.5);
            ctx.fill();
        }
    }
}
let statRequest = {}
let statCountries = {}
// setInterval(renderRequests, 10);
ws.onmessage = (m) => {
    if (m.data[0] == '{') {
        const message = JSON.parse(m.data);
        const type = message.type;
        const data = message.data;

        if (type == 'profile') {
            profile(document.getElementById('profile'), data)
        } else if (type == 'screenshot') {
            const screen = document.getElementById('screen')
            screen.src = "data:image/jpeg;base64," + data;
        } else if (type == 'trace') {
            traceMap[data.url] = data;
            const flightPlanCoordinates = [];
            for (let trace of data.trace) {
                statCountries[trace.geoip.country] = (statCountries[trace.geoip.country] || 0) + 1
                flightPlanCoordinates.push({
                    lat: trace.geoip.location.latitude,
                    lng: trace.geoip.location.longitude,
                })
            }

            console.log(getRandomColor())
            var flightPath = new google.maps.Polyline({
                path: flightPlanCoordinates,
                geodesic: true,
                strokeColor: getRandomColor(),
                strokeOpacity: 1.0,
                strokeWeight: 3
            });

            flightPath.setMap(map);
            document.querySelector('.nbCountry .value').innerText = Object.keys(statCountries).length
        } else if (type == 'request') {
            document.querySelector('.nbRequest .value').innerText = (parseInt(document.querySelector('.nbRequest .value').innerText) || 0) + 1
        } else if (type == 'requestEnd') {
            console.log(data.url, data.length)
            requestMap[data.url] = data;
            requests.push(data);
            totalSize += data.length
            const particle = new Particle(colorType(getRequestType(data)), data.length);
            particleMap[data.url] = particle;
            particles.push(particle);
            statRequest[getRequestType(data)] = (statRequest[getRequestType(data)]||0) + 1
            let output = ''
            for (let type in statRequest) {
                output += (type + '\t' + statRequest[type]) + '\n'
            }
            console.log(output)
            document.querySelector('.size .value').innerText = Math.floor(totalSize/1024/4)
            document.querySelector('.script .value').innerText = (statRequest['script'] || 0)
        } else if (type == 'coverage') {
            let totalBytes = 0;
            let usedBytes = 0;
            for (const entry of data) {
                coverageMap[entry.url] = entry;
                totalBytes += entry.text.length;
                let lUsedBytes = 0
                for (const range of entry.ranges) {
                    lUsedBytes += range.end - range.start - 1;
                }
                if (particleMap[entry.url]) {
                    particleMap[entry.url].coverage = lUsedBytes/entry.text.length;
                }
                usedBytes += lUsedBytes
                const s = document.createElement('div');
                s.innerHTML = entry.url + ' ' + entry.text.length + ' ' + (lUsedBytes);
                // scripts.appendChild(s);
            }

            var config = {
                type: 'pie',
                data: {
                    datasets: [{
                        data: [
                            usedBytes / totalBytes * 100,
                            (1 - (usedBytes / totalBytes)) * 100
                        ],
                        backgroundColor: [
                            "red",
                            "green"
                        ],
                        label: 'Coverage'
                    }]
                },
                options: {
                    responsive: true
                }
            };
            document.getElementById('coveragePie').height = document.getElementById('coveragePie').parentNode.clientHeight
            var ctx = document.getElementById('coveragePie').getContext('2d');
            window.myPie = new Chart(ctx, config);
        }
    }
}