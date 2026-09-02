import { AuthLoginPage } from '@admin-panel/components/auth-login-page';

type LoginProps = {
    loginAction: string;
};

export default function Login({ loginAction }: LoginProps) {
    return <AuthLoginPage action={{ method: 'post', url: loginAction }} />;
}
