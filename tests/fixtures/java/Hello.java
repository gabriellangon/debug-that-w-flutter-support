public class Hello {
    public static void greet(String name) {
        String message = "Hello, " + name + "!";
        System.out.println(message);
    }

    public static void main(String[] args) {
        int x = 42;
        int y = x + 1;
        greet("World");
        System.out.println("x=" + x + " y=" + y);
    }
}
