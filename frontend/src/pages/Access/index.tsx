import { PageContainer } from '@ant-design/pro-components';
import { Access, useAccess, useIntl } from '@umijs/max';
import { Button } from 'antd';

const AccessPage: React.FC = () => {
  const access = useAccess();
  const intl = useIntl();
  return (
    <PageContainer
      ghost
      header={{
        title: intl.formatMessage({ id: 'pages.access.title' }),
      }}
    >
      <Access accessible={access.canSeeAdmin}>
        <Button>{intl.formatMessage({ id: 'pages.access.adminButton' })}</Button>
      </Access>
    </PageContainer>
  );
};

export default AccessPage;
