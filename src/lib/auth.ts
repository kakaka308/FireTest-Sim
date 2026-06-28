import prisma from './prisma';

export interface LoginResult {
  success: boolean;
  userid?: string;
  username?: string;
  usertype?: string;
  message?: string;
}

export async function login(username: string, pwd: string): Promise<LoginResult> {
  if (!username || !pwd) {
    return { success: false, message: '用户名和密码不能为空' };
  }

  const operator = await prisma.operator.findFirst({
    where: {
      username: username,
      pwd: pwd,
    },
  });

  if (!operator) {
    return { success: false, message: '密码错误，请重新输入' };
  }

  return {
    success: true,
    userid: operator.userid,
    username: operator.username,
    usertype: operator.usertype,
  };
}
