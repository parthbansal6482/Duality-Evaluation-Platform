const Docker = require('dockerode');
const docker = new Docker();

async function testDocker() {
    try {
        console.log('\nTesting Container Creation...');
        const container = await docker.createContainer({
            Image: 'code-executor:latest',
            Cmd: ['/bin/bash', '-c', 'echo "Hello from Docker"'],
            HostConfig: {
                AutoRemove: true,
            },
        });
        console.log('Container created successfully.');

        await container.start();
        console.log('Container started successfully.');

        // Note: AutoRemove: true will remove the container after it stops
    } catch (err) {
        console.error('Container Error:', err.message);
    }
}

testDocker();
