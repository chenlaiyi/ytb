// 设置分支机构信息到localStorage
function setBranchInfo() {
    const branchUserInfo = {
        branch_code: 'YXY01',
        branch_id: 2,
        code: 'YXY01',
        id: 2,
        name: '益辛友01',
        user_id: 257,
        username: '测试用户'
    };
    
    // 设置分支机构信息
    localStorage.setItem('branch_userInfo', JSON.stringify(branchUserInfo));
    localStorage.setItem('userInfo', JSON.stringify(branchUserInfo));
    
    console.log('分支机构信息已设置:', branchUserInfo);
    
    // 设置完成后跳转到VIP列表
    if (confirm('分支机构信息已设置，是否跳转到VIP列表页面？')) {
        window.location.href = '#/branch/vip/vip-list';
    }
}

// 清除分支机构信息
function clearBranchInfo() {
    localStorage.removeItem('branch_userInfo');
    localStorage.removeItem('userInfo');
    console.log('分支机构信息已清除');
    alert('分支机构信息已清除');
}

// 检查当前分支机构信息
function checkBranchInfo() {
    const branchUserInfo = localStorage.getItem('branch_userInfo');
    const userInfo = localStorage.getItem('userInfo');
    
    console.log('当前分支机构信息:');
    console.log('branch_userInfo:', branchUserInfo);
    console.log('userInfo:', userInfo);
    
    if (branchUserInfo) {
        const parsed = JSON.parse(branchUserInfo);
        alert(`当前分支机构: ${parsed.name || parsed.branch_code || '未知'}`);
    } else {
        alert('未设置分支机构信息');
    }
}

// 自动执行
console.log('分支机构信息设置脚本已加载');
console.log('可用函数:');
console.log('- setBranchInfo(): 设置YXY01分支机构信息');
console.log('- clearBranchInfo(): 清除分支机构信息');
console.log('- checkBranchInfo(): 检查当前分支机构信息'); 