import { usePermission } from '../../hooks/usePermission';

const Can = ({ permission, children, fallback = null }) => {
    const { hasPermission } = usePermission();

    if (hasPermission(permission)) {
        return children;
    }

    return fallback;
};

export default Can;
