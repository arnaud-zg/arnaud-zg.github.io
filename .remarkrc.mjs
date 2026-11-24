import docs from "@arnaud-zg/configs/remark/docs";
import directive from "remark-directive";

// Starlight's asides, such as `:::note[Title]`.
export default { ...docs, plugins: [...docs.plugins, directive] };
