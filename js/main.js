const container = document.getElementById('canvas-container');

if (container) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 12000; // 밀도를 높여 도자기의 질감을 살림

    // 세 가지 상태의 좌표를 저장할 배열
    const posArray = new Float32Array(particlesCount * 3); // 현재 위치
    const originalPosArray = new Float32Array(particlesCount * 3); // 달항아리 형태 위치
    const targetPosArray = new Float32Array(particlesCount * 3); // 폭발(흩어짐) 형태 위치

    for (let i = 0; i < particlesCount; i++) {
        // --- 1. 달항아리 형태 계산 ---
        let y = (Math.random() - 0.5) * 4; // 높이: -2 ~ 2
        let normalizedY = (y + 2) / 4; 
        
        let radius;
        if (normalizedY > 0.92) {
            // 주둥이 (Neck)
            radius = 0.5 + (normalizedY - 0.92) * 1.5; 
        } else if (normalizedY < 0.08) {
            // 굽 (Base)
            radius = 0.4 + (0.08 - normalizedY) * 1.5;
        } else {
            // 배가 풍성한 항아리 곡선 (Math.pow로 볼륨감 극대화)
            radius = Math.pow(Math.sin(normalizedY * Math.PI), 0.6) * 2.2; 
        }

        let theta = Math.random() * Math.PI * 2;

        originalPosArray[i * 3] = radius * Math.cos(theta);     
        originalPosArray[i * 3 + 1] = y;                        
        originalPosArray[i * 3 + 2] = radius * Math.sin(theta); 

        // --- 2. 흩어진(폭발) 형태 계산 ---
        let expRadius = Math.random() * 15; // 우주처럼 넓게 퍼짐
        let expTheta = Math.random() * Math.PI * 2;
        let expPhi = Math.acos((Math.random() * 2) - 1);
        
        targetPosArray[i * 3] = expRadius * Math.sin(expPhi) * Math.cos(expTheta);
        targetPosArray[i * 3 + 1] = expRadius * Math.sin(expPhi) * Math.sin(expTheta);
        targetPosArray[i * 3 + 2] = expRadius * Math.cos(expPhi);

        // 초기 위치를 달항아리 형태로 설정
        posArray[i * 3] = originalPosArray[i * 3];
        posArray[i * 3 + 1] = originalPosArray[i * 3 + 1];
        posArray[i * 3 + 2] = originalPosArray[i * 3 + 2];
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.025, // 입자 크기를 키워서 시각적 질감 극대화
        color: 0xA68A64,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending // 점들이 겹칠 때 빛나는 효과
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    particlesMesh.rotation.x = 0.1;
    scene.add(particlesMesh);

    camera.position.z = 7;

    // 인터랙션 변수
    let mouseX = 0;
    let mouseY = 0;
    let isExploded = false; // 폭발 상태 여부

    // 마우스 움직임 감지
    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth) - 0.5;
        mouseY = (event.clientY / window.innerHeight) - 0.5;
    });

    // 화면 클릭 시 폭발 ↔ 모임 토글
    container.addEventListener('click', () => {
        isExploded = !isExploded;
        // 클릭 시 커서 모양 변경으로 피드백 제공
        container.style.cursor = isExploded ? 'zoom-out' : 'zoom-in';
    });
    container.style.cursor = 'zoom-in';

    function animate() {
        requestAnimationFrame(animate);

        // 점들을 목적지로 부드럽게 이동시키는 보간(Lerp) 애니메이션
        const positions = particlesGeometry.attributes.position.array;
        for(let i = 0; i < particlesCount * 3; i++) {
            const target = isExploded ? targetPosArray[i] : originalPosArray[i];
            // 현재 위치에서 타겟 위치로 5%씩 부드럽게 이동
            positions[i] += (target - positions[i]) * 0.05; 
        }
        particlesGeometry.attributes.position.needsUpdate = true;

        particlesMesh.rotation.y += 0.002; // 전체 회전
        particlesMesh.position.x += (mouseX * 0.5 - particlesMesh.position.x) * 0.05;
        particlesMesh.position.y += (-mouseY * 0.5 - particlesMesh.position.y) * 0.05;
        
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}