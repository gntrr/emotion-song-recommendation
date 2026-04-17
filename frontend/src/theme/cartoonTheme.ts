import type { ThemeConfig } from 'antd';

const cartoonTheme: ThemeConfig = {
  token: {
    colorText: '#51463B',
    colorPrimary: '#225555',
    colorBgBase: '#FAFAEE',
    colorBorder: '#225555',
    lineWidth: 2,
    borderRadius: 18,
    colorError: '#DA8787',
    colorInfo: '#9CD3D3',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  components: {
    Card: { colorBgContainer: '#BBAA99' },
    Button: { primaryShadow: 'none' },
    Modal: { boxShadow: 'none' },
    Select: { optionSelectedBg: '#CBC4AF' },
  },
};

export default cartoonTheme;
