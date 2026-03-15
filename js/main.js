const container = document.getElementById('canvas-container');

if (container) {
    const scene = new THREE.Scene();
    
    // [수정] 초기 카메라 거리 설정 (모바일/PC 구분)
    const initialZ = window.innerWidth < 768 ? 10 : 7;
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = initialZ;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 성능 최적화: 고해상도 기기 대응
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 12000; 

    const posArray = new Float32Array(particlesCount * 3);
    const originalPosArray = new Float32Array(particlesCount * 3);
    const targetPosArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount; i++) {
        // --- 1. 달항아리 형태 계산 ---
        let y = (Math.random() - 0.5) * 4; 
        let normalizedY = (y + 2) / 4; 
        
        let radius;
        if (normalizedY > 0.92) {
            radius = 0.5 + (normalizedY - 0.92) * 1.5; 
        } else if (normalizedY < 0.08) {
            radius = 0.4 + (0.08 - normalizedY) * 1.5;
        } else {
            radius = Math.pow(Math.sin(normalizedY * Math.PI), 0.6) * 2.2; 
        }

        let theta = Math.random() * Math.PI * 2;

        originalPosArray[i * 3] = radius * Math.cos(theta);     
        originalPosArray[i * 3 + 1] = y;                        
        originalPosArray[i * 3 + 2] = radius * Math.sin(theta); 

        // --- 2. 흩어진(폭발) 형태 계산 ---
        let expRadius = Math.random() * 15; 
        let expTheta = Math.random() * Math.PI * 2;
        let expPhi = Math.acos((Math.random() * 2) - 1);
        
        targetPosArray[i * 3] = expRadius * Math.sin(expPhi) * Math.cos(expTheta);
        targetPosArray[i * 3 + 1] = expRadius * Math.sin(expPhi) * Math.sin(expTheta);
        targetPosArray[i * 3 + 2] = expRadius * Math.cos(expPhi);

        posArray[i * 3] = originalPosArray[i * 3];
        posArray[i * 3 + 1] = originalPosArray[i * 3 + 1];
        posArray[i * 3 + 2] = originalPosArray[i * 3 + 2];
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: window.innerWidth < 768 ? 0.035 : 0.025, // 모바일에서 점이 너무 작아보이지 않게 조절
        color: 0xA68A64,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    particlesMesh.rotation.x = 0.1;
    scene.add(particlesMesh);

    // 인터랙션 변수
    let mouseX = 0;
    let mouseY = 0;
    let isExploded = false;

    // [추가] 마우스 및 터치 이벤트 통합 관리 함수
    const handleMove = (x, y) => {
        mouseX = (x / window.innerWidth) - 0.5;
        mouseY = (y / window.innerHeight) - 0.5;
    };

    document.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    
    // [추가] 터치 이벤트 대응
    document.addEventListener('touchmove', (e) => {
        if(e.touches.length > 0) {
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    container.addEventListener('click', () => {
        isExploded = !isExploded;
        container.style.cursor = isExploded ? 'zoom-out' : 'zoom-in';
    });
    
    // [추가] 모바일 탭 대응 (중복 실행 방지)
    container.addEventListener('touchstart', (e) => {
        // 탭 시 폭발 효과만 토글 (움직임은 touchmove에서 처리)
        if (e.touches.length === 1) {
            // 필요 시 클릭과 동일한 로직 추가 가능
        }
    }, { passive: true });

    function animate() {
        requestAnimationFrame(animate);

        const positions = particlesGeometry.attributes.position.array;
        for(let i = 0; i < particlesCount * 3; i++) {
            const target = isExploded ? targetPosArray[i] : originalPosArray[i];
            positions[i] += (target - positions[i]) * 0.05; 
        }
        particlesGeometry.attributes.position.needsUpdate = true;

        particlesMesh.rotation.y += 0.002; 
        particlesMesh.position.x += (mouseX * 0.5 - particlesMesh.position.x) * 0.05;
        particlesMesh.position.y += (-mouseY * 0.5 - particlesMesh.position.y) * 0.05;
        
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;

        camera.aspect = width / height;
        
        // [수정] 리사이즈 시에도 카메라 거리 동적 조절
        camera.position.z = window.innerWidth < 768 ? 10 : 7;
        
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
}