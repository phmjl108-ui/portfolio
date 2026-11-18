/* 포트폴리오 공통 정보 — 프로젝트 목록·연락처를 이 파일 한 곳에서 관리 */
window.PORTFOLIO = {
  owner: { name: 'Park Hyemin', role: 'UI/UX Designer', email: 'phmjl104@naver.com', phone: '010-4670-1295' },
  groups: [
    { id: 'xr', mark: 'X', name: 'XR', desc: '공간과 화면을 오가는 산업용 XR' },
    { id: 'vr', mark: 'V', name: 'VR', desc: '헤드셋 안에서 손으로 익히는 교육' },
    { id: 'ar', mark: 'A', name: 'AR', desc: '실제 장비 위에 겹쳐 보이는 안내' },
    { id: 'sim', mark: 'S', name: '시뮬레이터', desc: '실제 기계와 같은 조작 화면' },
    { id: 'dt', mark: 'D', name: '디지털 트윈', desc: '현장을 그대로 옮긴 관리 플랫폼' }
  ],
  // 화면 갤러리 타일 (프로젝트 id, 이미지)
  gallery: [
    ['hd-simulator', 'hd-sim-05-freemode'], ['korail', 'kr-05-wheel-ai'], ['koreatech-xr', 'ktx-06-factory-game'],
    ['xum', 'xum-04-avatar'], ['mcu', 'mcu-05-quiz']
  ],
  hero: 'xum-02-space',
  about: 'ktx-06-factory-game',
  projects: [
    { id: 'hd-xr', kr: 'LNG선 XR 콘텐츠', cover: 'legacy-a4db90a2', group: 'xr', num: '01', tab: 'HD 조선해양',
      client: 'HD 한국조선해양', title: 'XR Content for LNG vessels.',
      meta: ['Maritime · Industrial XR', 'PC · 16:9', '2025 · 14 months'] },
    { id: 'ar-guidance', kr: 'AR 장비 가이드', cover: 'legacy-cc2b3487', group: 'ar', num: '02', tab: 'AR Guidance',
      client: 'HD Hyundai Infracore', title: 'AR Guidance for heavy equipment.',
      meta: ['AR · Equipment Training', 'Tablet · 16:9', '2024'] },
    { id: 'vr-maintenance', kr: 'VR 정비 교육', cover: 'legacy-b9722ff7', group: 'vr', num: '03', tab: 'VR Maintenance',
      client: 'HD Hyundai Infracore · DEVELON', title: 'VR Maintenance for heavy equipment training.',
      meta: ['VR · Training + Showroom', 'Meta Quest', '2024.05 – 2025.01 · 9 months'] },
    { id: 'hd-simulator', kr: '굴착기 캐빈 시뮬레이터', cover: 'hd-sim-01-lobby', group: 'sim', num: '04', tab: 'HD Simulator',
      client: 'HD Hyundai Infracore · DEVELON', title: 'Cabin Simulator for excavator training.',
      meta: ['Simulator · Equipment Training', '전용 시뮬레이션 머신 · 4096×4320', '2024 — 2025'] },
    { id: 'mcu', kr: '중독 예방 VR', cover: 'mcu-03-select', group: 'vr', num: '05', tab: 'MCU 4ad',
      client: 'NHN Edu', title: 'MCU 4ad — Addiction prevention VR.',
      meta: ['VR · Prevention Education', 'Meta Quest', '2024'] },
    { id: 'korail', kr: 'KTX 정비 디지털 트윈', cover: 'kr-01-title', group: 'dt', num: '06', tab: 'KORAIL Metaverse',
      client: 'KORAIL · NIPA 메타버스 플래그쉽', title: 'Digital twin platform for KTX maintenance.',
      meta: ['Metaverse · Digital Twin · 5 Sub-systems', 'PC + Mobile', '2024 — 2025'] },
    { id: 'xum', kr: 'XR 협업 플랫폼', cover: 'xum-02-space', group: 'xr', num: '07', tab: 'XU:M',
      client: 'KISTI 한국과학기술정보연구원', title: 'XU:M — Open XR collaboration platform.',
      meta: ['XR · Web Portal · Multi-device', 'PC Web', '2024'] },
    { id: 'koreatech-xr', kr: '산업 XR 실습', cover: 'ktx-03-green-3d', group: 'xr', num: '08', tab: 'KOREATECH XR',
      client: '한국기술교육대학교 KOREATECH', title: 'Industrial XR Training for three domains.',
      meta: ['XR · Education · Digital Twin', 'PC Metaverse', '2024 — 2025'] },
    { id: 'koreatech-step', kr: '재료 시험 시뮬레이터', cover: 'step-ten-06-condition', group: 'sim', num: '09', tab: 'KOREATECH STEP',
      client: '한국기술교육대학교 · step 평생교육원', title: 'Lab Simulators for materials testing & heat treatment.',
      meta: ['Simulator · Lab Equipment', 'PC', '2024 — 2025'] }
  ]
};
